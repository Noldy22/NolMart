const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const GUIDES_DIR = path.join(__dirname, "../content/guides");
const OUTPUT_FILE = path.join(__dirname, "../public/guides.json");

// UPDATE THIS: Replace 'YOUR_USERNAME' and 'YOUR_REPO_NAME' with your actual GitHub details
const GITHUB_BASE_URL =
  "https://raw.githubusercontent.com/Noldy22/NolMart/master/public";

function buildProducts() {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
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
      return;
    }

    // Parse each markdown file
    const guides = files.map((file) => {
      const filePath = path.join(GUIDES_DIR, file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      // FIX 1: Extract 'content' (the body text) along with 'data' (the header fields)
      const { data, content } = matter(fileContent);

      const id = path.basename(file, ".md");

      // Helper function to convert local path to GitHub URL
      const getFullUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        const cleanPath = url.startsWith("/") ? url : `/${url}`;
        return `${GITHUB_BASE_URL}${cleanPath}`;
      };

      // add media object ID to be the specific text block's ID
      let media = [];

      // Check for the 'images' (legacyImages) list (Array)
      if (data.image_section) {
        data.image_section.map((section) => {
          let rawPath = "";
          //string = entered url
          //object = uploaded image
          if (section.image) {
            if (typeof section.image === "string") rawPath = section.image;
            else if (typeof section.image === "object" && section.image.image)
              rawPath = section.image.image;
          }

          if (rawPath) {
            media.push({ 
              type: "image", 
              title: section.title, 
              url: getFullUrl(rawPath) 
            });
          }
        });
      }

      const guideTitle = data.name
      
      console.log("DATA: ", data, "CONTENT: ", content, "Image section", media, "TIle: ", guideTitle, data.title)

      return {
        id: id,
        name: guideTitle || "",
        name_lower: (guideTitle || "").toLowerCase(),
        media: media || "",
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

buildProducts();
