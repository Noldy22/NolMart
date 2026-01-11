const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const PRODUCTS_DIR = path.join(__dirname, '../content/products');
const OUTPUT_FILE = path.join(__dirname, '../public/products.json');

// UPDATE THIS: Replace 'YOUR_USERNAME' and 'YOUR_REPO_NAME' with your actual GitHub details
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Noldy22/NolMart/master/public';

function buildProducts() {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if products directory exists
    if (!fs.existsSync(PRODUCTS_DIR)) {
      console.log('⚠️  Products directory not found. Creating empty products.json');
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
      return;
    }

    // Read all markdown files from products directory
    const files = fs.readdirSync(PRODUCTS_DIR)
      .filter(file => file.endsWith('.md'));

    if (files.length === 0) {
      console.log('⚠️  No product files found. Creating empty products.json');
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
      return;
    }

    // Parse each markdown file
    const products = files.map((file) => {
      const filePath = path.join(PRODUCTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // FIX 1: Extract 'content' (the body text) along with 'data' (the header fields)
      const { data, content } = matter(fileContent);

      const id = path.basename(file, '.md');

      // Helper function to convert local path to GitHub URL
      const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${GITHUB_BASE_URL}${cleanPath}`;
      };

      // Process image URLs
      let imageUrls = [];

      // Check for the CMS 'image' field (Single image)
      if (data.image) {
        imageUrls.push(getFullUrl(data.image));
      }

      // Check for the legacy 'images' list (Array)
      if (data.images && Array.isArray(data.images)) {
        const legacyImages = data.images.map(img => {
          let rawPath = '';
          if (typeof img === 'string') rawPath = img;
          else if (typeof img === 'object' && img.image) rawPath = img.image;
          
          return rawPath ? getFullUrl(rawPath) : null;
        }).filter(Boolean);
        imageUrls = [...imageUrls, ...legacyImages];
      }

      // Fallback for videoUrl if it's an image
      if (imageUrls.length === 0 && data.videoUrl) {
        const videoUrlLower = data.videoUrl.toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => videoUrlLower.endsWith(ext));
        if (isImage) {
          imageUrls.push(getFullUrl(data.videoUrl));
        }
      }

      // FIX 2: Check 'content' first for the description, then fall back to other fields
      // The CMS usually saves the 'body' field as the main file content
      const descriptionText = content || data.body || data.description || '';

      return {
        id: id,
        name: data.title || data.name || 'Untitled Product',
        name_lower: (data.title || data.name || 'Untitled Product').toLowerCase(),
        price: parseFloat(data.price) || 0,
        description: descriptionText.trim(), // Trim removes extra empty lines
        category: data.category || 'Other',
        subcategory: data.subcategory || '',
        imageUrls: imageUrls,
        videoUrl: data.videoUrl ? getFullUrl(data.videoUrl) : '',
        videoLink: data.videoLink || '',
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      };
    });

    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));

    console.log(`✅ Built ${products.length} products with GitHub URLs to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error building products:', error);
    process.exit(1);
  }
}

buildProducts();