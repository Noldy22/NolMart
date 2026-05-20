# NolMart - Cloudflare Pages Deployment Guide

This guide will help you deploy NolMart to Cloudflare Pages with Decap CMS for free.

## Prerequisites

1. A GitHub account
2. A Cloudflare account (free tier works)
3. Your code committed to a GitHub repository

## Step 1: Prepare Your Repository

1. Install dependencies locally:
   ```bash
   npm install
   ```

2. Build the products JSON file (initially empty):
   ```bash
   npm run build
   ```

3. Commit all changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "Migrated to Decap CMS"
   git push origin master
   ```

## Step 2: Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. Navigate to **Pages** > **Create a project**

3. Select **Connect to Git** and authorize Cloudflare to access your GitHub repository

4. Select your **NolMart** repository

5. Configure the build settings:
   - **Production branch**: `master` (or `main`)
   - **Build command**: `npm run build`
   - **Build output directory**: `/` (root directory)
   - **Root directory**: `/` (leave empty)

6. Click **Save and Deploy**

7. Wait for the first deployment to complete (2-3 minutes)

8. Your site will be live at: `https://nolmart-xxx.pages.dev`

## Step 3: Set Up Decap CMS Authentication

Decap CMS needs authentication to manage content. You have two options:

### Option A: GitHub OAuth (Recommended)

1. Go to your Cloudflare Pages project settings

2. Navigate to **Functions** > **Environment Variables**

3. Add the following variables:
   - `GITHUB_OWNER`: Your GitHub username
   - `GITHUB_REPO`: Your repository name (e.g., `NolMart`)

4. Update `admin/config.yml` to use GitHub backend:
   ```yaml
   backend:
     name: github
     repo: your-username/NolMart
     branch: master
   ```

5. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - **Application name**: NolMart CMS
   - **Homepage URL**: `https://your-site.pages.dev`
   - **Authorization callback URL**: `https://api.netlify.com/auth/done`

   Note: Even on Cloudflare, you can use Netlify's OAuth gateway for convenience.

6. Copy the **Client ID** and **Client Secret**

7. Add them to Decap CMS config:
   - Update `admin/config.yml`:
     ```yaml
     backend:
       name: github
       repo: your-username/NolMart
       branch: master
       base_url: https://api.netlify.com
       auth_endpoint: auth
     ```

### Option B: Git Gateway with Netlify Identity (Alternative)

If you prefer a simpler setup without OAuth:

1. Create a free Netlify account
2. Deploy your site to Netlify as well (just for Identity service)
3. Enable Netlify Identity on that site
4. Enable Git Gateway in Netlify Identity settings
5. Update `admin/config.yml`:
   ```yaml
   backend:
     name: git-gateway
     branch: master
   ```

## Step 4: Access Your Admin Panel

1. Visit `https://your-site.pages.dev/admin`

2. Log in with your GitHub account (or Netlify Identity)

3. Start adding products!

## Step 5: Automatic Deployments

Every time you:
- Add a product via Decap CMS
- Edit a product
- Delete a product

Decap CMS will create a Git commit, which triggers Cloudflare Pages to:
1. Pull the changes
2. Run `npm run build` to regenerate `public/products.json`
3. Deploy the updated site

This happens automatically in 1-2 minutes!

## File Structure

```
NolMart/
├── admin/                    # Decap CMS admin panel
│   ├── index.html           # CMS entry point
│   └── config.yml           # CMS configuration
├── content/
│   └── products/            # Product Markdown files (managed by CMS)
├── public/
│   ├── uploads/             # Product images/videos (managed by CMS)
│   └── products.json        # Generated product data (auto-built)
├── scripts/
│   └── build-products.js    # Build script (Markdown → JSON)
├── js/                      # JavaScript modules
├── css/                     # Stylesheets
├── *.html                   # Public pages
└── package.json             # Dependencies and build scripts
```

## Adding Your First Product

1. Go to `https://your-site.pages.dev/admin`
2. Click **Products** > **New Product**
3. Fill in the product details:
   - Product Name
   - Price (in Tzs)
   - Description
   - Category
   - Upload images
   - Optional: Add video
4. Click **Publish**
5. Wait 1-2 minutes for deployment
6. Check your homepage - the product should appear!

## Troubleshooting

### Products not showing up
- Check that `npm run build` runs successfully locally
- Verify `public/products.json` is being generated
- Check Cloudflare Pages build logs

### Admin panel shows "Error loading config"
- Verify `admin/config.yml` is correctly formatted (YAML syntax)
- Check that your GitHub repo settings are correct

### Authentication fails
- Verify GitHub OAuth app settings
- Check callback URL matches exactly
- Try clearing browser cache and logging in again

### Build fails on Cloudflare
- Check that `package.json` is committed
- Verify `scripts/build-products.js` exists
- Check build logs for specific errors

## Cost

This entire setup is **100% FREE**:
- ✅ Cloudflare Pages: Free tier (unlimited bandwidth)
- ✅ GitHub: Free repository hosting
- ✅ Decap CMS: Free and open source
- ✅ No database costs
- ✅ No API costs

## Next Steps

- Customize categories in `admin/config.yml`
- Add more product fields if needed
- Set up a custom domain in Cloudflare Pages settings
- Enable Cloudflare Web Analytics (free)

## Support

For issues or questions:
1. Check Cloudflare Pages documentation
2. Check Decap CMS documentation
3. Review build logs in Cloudflare dashboard
