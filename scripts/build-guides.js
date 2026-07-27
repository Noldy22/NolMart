const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const deepl = require("deepl-node");

require("dotenv").config({ path: ".env.local" });

const deeplClient = new deepl.DeepLClient(process.env.DEEPL_API_KEY);

const GUIDES_DIR = path.join(__dirname, "../content/guides");

const OUTPUT_DIR = path.join(__dirname, "../translations/guides");

// Assums main language is written in english
// For future references: Use loop for multiple languages

// TODO
const ENGLISH_FILE = path.join(__dirname, "../translations/guides/en.json");
const SWAHILI_FILE = path.join(__dirname, "../translations/guides/sw.json");

const cache = new Map();

const supportedLanguages = ['en', 'sw'];

// UPDATE THIS: Replace 'YOUR_USERNAME' and 'YOUR_REPO_NAME' with your actual GitHub details
const GITHUB_BASE_URL =
  "https://raw.githubusercontent.com/Noldy22/NolMart/master/public";

async function buildGuides() {
  try {

    // Read all markdown files from guides directory
    const files = fs
      .readdirSync(GUIDES_DIR)
      .filter((file) => file.endsWith(".md"));

    for (const filePath of [ENGLISH_FILE, SWAHILI_FILE]) {
      // Ensure output directory exists
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      // Ensure file path exists
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }

      // Check if guides directory exists
      if (!fs.existsSync(GUIDES_DIR)) {
        console.log("⚠️  Guides directory not found. Creating empty JSON guides");
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }

      // Ensure guides directory are empty if no md files
      if (files.length === 0) {
        console.log("⚠️  No guide files found. Creating empty guides.json");
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return
      }
    }

    // Parse each markdown file
    const guides = files.map((file) => {
      const filePath = path.join(GUIDES_DIR, file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      // FIX 1: Extract 'content' (the body text) along with 'data' (the header fields)
      const { data } = matter(fileContent);

      const id = path.basename(file, ".md");

      const guideTitle = data.name || data.title;
      const textBlocks = data.section;

      let formattedTextBlocks = []

      //TODO: improve code to prevent repetitiveness
      textBlocks.map(block => {
        const heading = block.heading;
        const imageBlocks = block.image_section;

        let subSection = [];

        if (block.sub_section) {
          block.sub_section.map((sect) => {
            let tempArray = [];

            if (sect.list && sect.list.length > 0) {
              sect.list.map((item) => {
                tempArray.push(item.bullet_point);
              })
            }

            subSection.push({ 
              heading: sect.heading || "",
              paragraph: sect.paragraph || "",
              list: tempArray,
              image_section: loadImages(sect.image_section) || ""
            });
          });
        }

        // TODO: Add code for videos

        //dealing with bp
        let tempArray = [];

        if (block.list && block.list.length > 0) {
          block.list.map((item) => {
            tempArray.push(item.bullet_point);
          })
        }

        formattedTextBlocks.push({
          heading: heading || "",
          paragraph: block.paragraph || "",
          list: tempArray,
          image_sections: loadImages(imageBlocks) || "",
          sub_sections: subSection,
        })
      })

      return {
        id: id,
        name: guideTitle || "",
        language: data.language,
        category: data.category,
        sections: formattedTextBlocks,
        createdAt: data.createdAt
          ? new Date(data.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: data.updatedAt
          ? new Date(data.updatedAt).toISOString()
          : new Date().toISOString(),
      };
    });

    guides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let fileA = []; // language 1
    let fileB = []; // language 2

    // Insert guides according to language (fileA)
    for (const guide of guides) {
      if (guide.language === 'en') {
        fileA.push(guide);

        const translatedGuide = await findTranslation(guide.id, guide, SWAHILI_FILE, 'en', 'sw');
        fileB = translatedGuide;
      }
      else if (guide.language === 'sw') {
        const translatedGuide = await findTranslation(guide.id, guide, ENGLISH_FILE, 'sw', 'en');
        fileA = translatedGuide;

        fileB.push(guide);
      }
    }

    fs.writeFileSync(ENGLISH_FILE, JSON.stringify(fileA, null, 2));
    fs.writeFileSync(SWAHILI_FILE, JSON.stringify(fileB, null, 2));

    console.log(
      `✅ Built ${guides.length} guides with GitHub URLs to ${ENGLISH_FILE}`,
      `✅ Built ${guides.length} guides with GitHub URLs to ${SWAHILI_FILE}`,
    );
  } catch (error) {
    console.error("❌ Error building guides:", error);
    process.exit(1);
  }
}

buildGuides();

function loadImages(imageBlocks) {
  let media = [];

  // Helper function to convert local path to GitHub URL
  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${GITHUB_BASE_URL}${cleanPath}`;
  };
  
  if (imageBlocks) {
    imageBlocks.map((imageBlock) => {
      let rawPath = "";

      if (imageBlock.image) {
        if (typeof imageBlock.image === "string") rawPath = imageBlock.image;
      }
      
      if (rawPath && rawPath.length > 0) {
        media.push({ 
          type: "image", 
          title: imageBlock.title, 
          url: getFullUrl(rawPath) 
        });
      }
    });
  }

  return media
}

async function findTranslation(id, originalGuide, TRANSLATE_FILE, lang1, lang2) {
  // if translation folder file has the entry id ... else create (with api response).

  // For future references: Use loop if more than 1 language, different files under translations/guides

  const fileTLContent = fs.readFileSync(TRANSLATE_FILE, "utf8");

  const originalContent = originalGuide;

  // Checks if the current guide being processed (built)'s translated version exists.
  const translationItems = (!fileTLContent.length) ? [] : JSON.parse(fileTLContent);
  const translateGuide = translationItems.find(content => content.id === id);

  if (translateGuide) {return [translateGuide]}

  const entries = await Promise.all(
    Object.entries(originalContent).map(async ([key, value]) => {
      return [key, await translateItem(key, value, lang1, lang2)];
    })
  );
  
  const newContentTranslation = Object.fromEntries(entries);

  // push newContentTranslation to translationItems
  translationItems.push(newContentTranslation);

  return translationItems;
}

async function translateItem(key, value, lang1, lang2) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    let newObject = {};

    await Promise.all(
      Object.entries(value).map(async ([k, v]) => {
        newObject[k] = await translateItem(k, v, lang1, lang2);
    }))

    return newObject
  } 

  if (Array.isArray(value)) {
    const newArray = await Promise.all(
      value.map(async (item) => 
        await translateItem(key, item, lang1, lang2)
      )
    );

    return newArray
  }


  let translatedItem;

  if (key === 'name' || key === 'heading' || key === 'paragraph' || key === 'list') {
    translatedItem = getAllText(value, lang1,lang2)
  } else {
    translatedItem = value;
  }

  return translatedItem;
}


// CHANGE TO GET TRANSLATED TEXT. USE SOME CODE LANGAUGE FROM BUILD-GUIDES.JS
async function getAllText(text, lang1='en', lang2='sw') {
    if (cache.has(text)) return cache.get(text);

    let translated = await translateArticle(text, lang1, lang2);
    cache.set(text, translated);
    
    return translated;
}

async function translate(text, source, target) {
  try {
    const result = await deeplClient.translateText(text, source||null, target);

    return result.text

  } catch (error) {
      // Detailed error catch if your server crashes or rejects the parameters
      console.error("Frontend retrieval error:", error.response ? error.response.data : error.message);
  }
}

async function translateArticle(text, sourceLang, targetLang) {
  const result = await translate(text, sourceLang, targetLang);
  return result;
}