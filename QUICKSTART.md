# NolMart - Quick Start Guide

## What Changed?

Your NolMart website has been successfully migrated from **Firebase** to **Decap CMS** (Git-based CMS) for free hosting on **Cloudflare Pages**.

### Before vs After

| Feature | Before (Firebase) | After (Decap CMS) |
|---------|------------------|-------------------|
| **Backend** | Firebase Firestore | Markdown files in Git |
| **Admin Panel** | Custom Firebase UI | Decap CMS (`/admin`) |
| **Image Storage** | Firebase Cloud Storage | Git repository (`public/uploads/`) |
| **Authentication** | Firebase Auth | GitHub OAuth |
| **Hosting** | Any static host | Cloudflare Pages (free) |
| **Database** | Firestore (paid after limits) | None (static JSON file) |
| **Build Process** | None | `npm run build` (Markdown → JSON) |

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Products JSON

```bash
npm run build
```

This converts Markdown product files from `content/products/` into `public/products.json`.

### 3. Run Local Server

```bash
npm run dev
```

Or use any local server:
```bash
npx serve .
```

Visit: `http://localhost:3000`

### 4. Test the Admin Panel Locally

Visit: `http://localhost:3000/admin`

**Note:** Local admin won't work until you deploy to Cloudflare Pages and set up GitHub authentication.

## Deploying to Cloudflare Pages

See the detailed guide: **[README-DEPLOYMENT.md](./README-DEPLOYMENT.md)**

**Quick Steps:**
1. Push code to GitHub
2. Connect GitHub repo to Cloudflare Pages
3. Set build command to `npm run build`
4. Deploy!

## Adding Products

### Via Decap CMS Admin (Recommended)

1. Go to `https://your-site.pages.dev/admin`
2. Log in with GitHub
3. Click **Products** → **New Product**
4. Fill in the form:
   - Product Name
   - Price (Tzs)
   - Description
   - Category
   - Upload Images
   - Optional: Video URL or Link
5. Click **Publish**
6. Wait 1-2 minutes for auto-deployment

### Manually (For Advanced Users)

Create a file in `content/products/my-product.md`:

```markdown
---
name: "iPhone 15 Pro Max"
price: 2500000
description: "Latest iPhone with amazing camera and performance."
category: "Electronics"
images:
  - /uploads/iphone-1.jpg
  - /uploads/iphone-2.jpg
videoUrl: ""
videoLink: "https://www.youtube.com/watch?v=..."
createdAt: 2025-12-11T10:00:00Z
updatedAt: 2025-12-11T10:00:00Z
---
```

Then:
```bash
npm run build  # Regenerate products.json
git add .
git commit -m "Add iPhone 15 Pro Max"
git push
```

## File Structure

```
NolMart/
├── admin/                          # Decap CMS
│   ├── index.html                 # Admin UI
│   └── config.yml                 # CMS configuration
│
├── content/
│   └── products/                  # Product markdown files
│       ├── product-1.md
│       └── product-2.md
│
├── public/
│   ├── uploads/                   # Product images/videos
│   │   ├── image1.jpg
│   │   └── video1.mp4
│   └── products.json              # Generated (don't edit manually)
│
├── scripts/
│   └── build-products.js          # Build script
│
├── js/                            # JavaScript (no Firebase!)
│   ├── main.js
│   ├── public-products.js         # Fetches from JSON
│   ├── product-detail.js          # Fetches from JSON
│   ├── cart.js
│   └── ...
│
├── css/
│   └── styles.css                 # Unchanged styling
│
├── index.html                     # Homepage
├── products.html                  # Products page
├── product-detail.html            # Product detail page
├── cart.html                      # Shopping cart
├── about.html                     # About page
├── contact.html                   # Contact page
│
├── package.json                   # Dependencies
├── README-DEPLOYMENT.md           # Full deployment guide
└── QUICKSTART.md                  # This file
```

## What Was Removed

The following files were **deleted** (no longer needed):

- ❌ `js/firebase-config.js`
- ❌ `js/auth.js`
- ❌ `js/admin-add-product.js`
- ❌ `js/admin-products.js`
- ❌ `admin-login.html`
- ❌ `admin-dashboard.html`
- ❌ `admin-add-product.html`
- ❌ `admin-products.html`

## What Was Modified

### JavaScript Files
- **`js/public-products.js`** - Now fetches from `/public/products.json` instead of Firestore
- **`js/product-detail.js`** - Now fetches from `/public/products.json` instead of Firestore
- **`js/main.js`** - Removed Firebase auth references

### HTML Files
All HTML files were updated to:
- Remove Firebase script imports
- Change "Admin Login" link to "Admin Panel" (`/admin`)

### Design & Styling
- ✅ **No changes** - CSS and layout remain identical
- ✅ **No changes** - All product cards, cart, checkout flow unchanged

## How Products Are Displayed

1. **Content Creation**: You create products via Decap CMS (`/admin`)
2. **Git Commit**: Decap CMS commits Markdown files to GitHub
3. **Auto Build**: Cloudflare Pages runs `npm run build`
4. **JSON Generation**: Build script converts Markdown → `public/products.json`
5. **Website Update**: JavaScript fetches from `products.json` and displays products

## Troubleshooting

### No products showing on the website
- Check that `public/products.json` exists and has data
- Run `npm run build` locally to test
- Check Cloudflare Pages build logs

### Admin panel not loading
- Verify you've set up GitHub OAuth
- Check `admin/config.yml` has correct repo name
- Clear browser cache

### Images not loading
- Ensure images are in `public/uploads/`
- Check image paths in Markdown files
- Verify Cloudflare Pages is serving static assets

## Next Steps

1. **Deploy to Cloudflare Pages** - Follow `README-DEPLOYMENT.md`
2. **Add Products** - Use the `/admin` panel
3. **Customize** - Update categories, add fields, modify styling
4. **Custom Domain** - Set up in Cloudflare Pages settings
5. **Analytics** - Enable Cloudflare Web Analytics (free)

## Support

- **Deployment Issues**: Check Cloudflare Pages documentation
- **CMS Issues**: Check Decap CMS documentation
- **Build Errors**: Check build logs in Cloudflare dashboard

## Benefits of This Migration

✅ **100% Free** - No Firebase costs, no database fees
✅ **Fast** - Static site, globally distributed CDN
✅ **Simple** - No complex backend, just Markdown files
✅ **Version Control** - All products tracked in Git
✅ **No Vendor Lock-in** - Can move to any static host
✅ **SEO Friendly** - Static HTML, fast loading
✅ **Easy Backups** - Everything is in Git

Enjoy your new setup! 🎉
