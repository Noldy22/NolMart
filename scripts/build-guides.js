const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const GUIDES_DIR = path.join(__dirname, "../content/guides");
const OUTPUT_FILE = path.join(__dirname, "../public/guides.json");

const TRANSLATED_FILE = path.join(__dirname, "../public/translated-guides/sw.json");

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
        name_lower: (guideTitle || "").toLowerCase(),
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

function findTranslation(id, TRANSLATED_FILE) {
  console.log(id);
  // if translation folder file has the entry id ... else create (with api response).

  const fileOGContent = fs.readFileSync(OUTPUT_FILE, "utf8");
  const fileTLContent = fs.readFileSync(TRANSLATED_FILE, "utf8");

  const originalContent = JSON.parse(fileOGContent).find(content => content.id === id);

  let translationItems;

  if (fileTLContent.length === 0) {
    translationItems = [] // means no translated guides
  } else {translationItems = JSON.parse(fileTLContent)} // means there r translated guides, to add the new one

  const translateExists = translationItems.find(content => content.id === id);

  // if translation for it already exists in translation files, dont translate.
  if (translateExists) {return}

  // open up the original content

  let newContentTranslation = [];
  Object.entries(originalContent).forEach(([key, value]) => {
    newContentTranslation = [{...newContentTranslation, key: translateItem(originalContent)}];
  })

  // push newContentTranslation to translationItems

  console.log("new: ", newContentTranslation);

  // write the array into guides
  //fs.writeFileSync(TRANSLATED_FILE, JSON.stringify(guides, null, 2));
}

function translateItem(value) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    let newObject = [];

    Object.entries(value).forEach(([key, value]) => {
      newObject = [{...newObject, key: translateItem(value)}]
    })
  } 

  if (Array.isArray(value)) {
    // forEach
    let newArray = [];
    value.forEach(item => newArray = [...newArray, translateItem(item)]);

  }

  // tranlsation
  let translatedItem;

  // if could be an array
  if (key === 'heading' || key === 'paragraph' || key === 'bullet_point') {
    //translate
    translatedItem = getAllText(value)
  } else {
    translatedItem = value;
  }

  console.log(translatedItem)

  return translatedItem;
}

buildGuides();





const cache = new Map();


// CHANGE TO GET TRANSLATED TEXT. USE SOME CODE LANGAUGE FROM BUILD-GUIDES.JS
async function getAllText(text, lang1='en', lang2='sw') {
    await translateCache(cache, text, lang1, lang2);

    await Promise.all(promises);
}

async function translateCache(cache, text, lang1, lang2) {
    if (cache.has(text)) return cache.get(text);

    translated = await translateArticle(text, lang1, lang2);
    cache.set(text, translated);
    
    return translated;
}

async function translateArticle(text, sourceLang, targetLang) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      source: sourceLang,
      target: targetLang
    })
  });

  const data = await response.json();
  return data.translatedText;
}