const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const axios = require("axios");

const GUIDES_DIR = path.join(__dirname, "../content/guides");
const OUTPUT_FILE = path.join(__dirname, "../public/guides.json");

// assuming language wirrten in en
const TRANSLATED_FILE = path.join(__dirname, "../translations/guides/sw.json");

const cache = new Map();

// UPDATE THIS: Replace 'YOUR_USERNAME' and 'YOUR_REPO_NAME' with your actual GitHub details
const GITHUB_BASE_URL =
  "https://raw.githubusercontent.com/Noldy22/NolMart/master/public";

function buildGuides() {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Ensure output directory for translations exists
    const translatedDir = path.dirname(TRANSLATED_FILE);
    if (!fs.existsSync(translatedDir)) {
      fs.mkdirSync(translatedDir, { recursive: true });
    }

    // Check if guides directory exists
    if (!fs.existsSync(GUIDES_DIR)) {
      console.log("⚠️  Guides directory not found. Creating empty guides.json");
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
      return;
    }

    // Read all markdown files from guides directory
    const files = fs
      .readdirSync(GUIDES_DIR)
      .filter((file) => file.endsWith(".md"));

    if (files.length === 0) {
      console.log("⚠️  No guide files found. Creating empty guides.json");
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
      fs.writeFileSync(TRANSLATED_FILE, JSON.stringify([], null, 2));
      return;
    }

    // Parse each markdown file
    const guides = files.map((file) => {
      const filePath = path.join(GUIDES_DIR, file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      // FIX 1: Extract 'content' (the body text) along with 'data' (the header fields)
      const { data } = matter(fileContent);

      const id = path.basename(file, ".md");

      // Helper function to convert local path to GitHub URL
      const getFullUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        const cleanPath = url.startsWith("/") ? url : `/${url}`;
        return `${GITHUB_BASE_URL}${cleanPath}`;
      };

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

      findTranslation(id, TRANSLATED_FILE);

      return {
        id: id,
        name: guideTitle || "",
        //name_lower: (guideTitle || "").toLowerCase(),
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

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(guides, null, 2));

    console.log(
      `✅ Built ${guides.length} guides with GitHub URLs to ${OUTPUT_FILE}`,
    );
  } catch (error) {
    console.error("❌ Error building guides:", error);
    process.exit(1);
  }
}

buildGuides();

function loadImages(imageBlocks) {
  let media = [];
  
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

async function findTranslation(id, TRANSLATED_FILE) {
  console.log(id);
  // if translation folder file has the entry id ... else create (with api response).

  const fileOGContent = fs.readFileSync(OUTPUT_FILE, "utf8");
  const fileTLContent = fs.readFileSync(TRANSLATED_FILE, "utf8");

  const originalContent = JSON.parse(fileOGContent).find(content => content.id === id);

  const translationItems = (!fileTLContent.length) ? [] : JSON.parse(fileTLContent);

  // if translation for it already exists in translation files, dont translate.
  const translatedGuide = translationItems.find(content => content.id === id);
  if (translatedGuide) {return}



  let newContentTranslation = {};

  Object.entries(originalContent).map(async ([key, value]) => {
    newContentTranslation[key] = await translateItem(key, value);
  })

  //await Promise.all(promises);

  // push newContentTranslation to translationItems
  translationItems.push(newContentTranslation);
  console.log("new: ", translationItems);

  // write the array into guides
  //fs.writeFileSync(TRANSLATED_FILE, JSON.stringify(translationItems, null, 2));
}

async function translateItem(key, value) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    let newObject = {};

    Object.entries(value).map(async ([k, v]) => {
      newObject[k] = await translateItem(k, v);
    })

    //await Promise.all(promises);

    return newObject
  } 

  if (Array.isArray(value)) {
    let newArray = [];

    value.map(async (item) => newArray.push(await translateItem(key, item)));
    //await Promise.all(promises);

    return newArray
  }

  //if any thing other than object (eg: image, text, video)...

  // tranlsation
  let translatedItem;

  if (key === 'name' || key === 'heading' || key === 'paragraph' || key === 'list') {
    translatedItem = getAllText(value)
  } else {
    translatedItem = value;
  }

  return translatedItem;
}


// CHANGE TO GET TRANSLATED TEXT. USE SOME CODE LANGAUGE FROM BUILD-GUIDES.JS
async function getAllText(text, lang1='en', lang2='sw') {
    if (cache.has(text)) return cache.get(text);

    translated = await translateArticle(text, lang1, lang2);
    cache.set(text, translated);
    
    return translated;
}

async function translate(text, source, target) {
  const response = await axios.get(
    "https://libretranslate.com/translate",
    {
      params: {
        q: text,
        source: "en",
        target: "sw",
        format: "text"
      },
      timeout: 10000
    }
  );

  const data = await response.json();
  console.log("DATA: ", data);

  return data;
}

async function translateArticle(text, sourceLang, targetLang) {
  const result = await translate(text, sourceLang, targetLang);

  return result;
}