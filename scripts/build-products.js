const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const PRODUCTS_DIR = path.join(__dirname, '../content/products');
const OUTPUT_FILE = path.join(__dirname, '../public/products.json');

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
    const products = files.map((file, index) => {
      const filePath = path.join(PRODUCTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);

      // Generate ID from filename (remove .md extension)
      const id = path.basename(file, '.md');

      // Process image URLs
      let imageUrls = [];
      if (data.images && Array.isArray(data.images)) {
        imageUrls = data.images.map(img => {
          if (typeof img === 'string') return img;
          if (typeof img === 'object' && img.image) return img.image;
          return null;
        }).filter(Boolean);
      }

      // Fallback: If no images but videoUrl is an image file, use it as the first image
      if (imageUrls.length === 0 && data.videoUrl) {
        const videoUrlLower = data.videoUrl.toLowerCase();
        if (videoUrlLower.endsWith('.jpg') || videoUrlLower.endsWith('.jpeg') ||
            videoUrlLower.endsWith('.png') || videoUrlLower.endsWith('.gif') ||
            videoUrlLower.endsWith('.webp')) {
          imageUrls.push(data.videoUrl);
        }
      }

      // Return product object matching the original Firebase structure
      return {
        id: id,
        name: data.name || 'Untitled Product',
        name_lower: (data.name || 'Untitled Product').toLowerCase(),
        price: parseFloat(data.price) || 0,
        description: data.description || '',
        category: data.category || 'Other',
        imageUrls: imageUrls,
        videoUrl: data.videoUrl || '',
        videoLink: data.videoLink || '',
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
      };
    });

    // Sort products by createdAt (newest first) to match Firebase behavior
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));

    console.log(`✅ Built ${products.length} products to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error building products:', error);
    process.exit(1);
  }
}

buildProducts();
