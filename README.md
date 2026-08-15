# Sunshine ERP & POS System

A full-featured Business Management, Inventory, Point of Sale (POS), Billing & Customer Ledger system built with React, Vite, Tailwind CSS, and Supabase.

---

## 🚀 How to Deploy from GitHub to Netlify

Deploying this project from GitHub to Netlify is fast and automatic. Follow these simple steps:

### Step 1: Push Code to GitHub
Push this codebase to a repository on your GitHub account:
```bash
git init
git add .
git commit -m "Initial commit - Sunshine ERP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.name.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project**.
3. Choose **GitHub** and authorize access to your repository.
4. Select your **Sunshine ERP** repository.

### Step 3: Configure Build Settings
Netlify will automatically detect the settings from `netlify.toml`:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### Step 4: Environment Variables
Go to **Site settings > Environment variables** in Netlify and add:
- `VITE_SUPABASE_URL` = `https://bvmkiuxetrtltwvhpuxl.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_0t640hDMl_xjSC8ZZRUJQg_LZTmLVHG`

*(Note: Built-in safe fallbacks are also configured in `src/lib/supabase.ts` so the site builds smoothly out of the box).*

### Step 5: Deploy Site
Click **Deploy site**. Netlify will build and deploy your application in under a minute!
