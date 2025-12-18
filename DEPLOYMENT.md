# Deployment Guide - Tron Solar Inventory

## Deploying to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free - sign up with GitHub)

### Step 1: Prepare Your Code for Git

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial Tron Solar Inventory System"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the "+" in top right → "New repository"
3. Name it: `tron-inventory`
4. Make it **Private** (recommended for internal tools)
5. Click "Create repository"

### Step 3: Push to GitHub

```bash
# Add your GitHub repo as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/tron-inventory.git

# Push code
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" → Choose "Continue with GitHub"
   - Authorize Vercel to access GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Find `tron-inventory` in the list
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)

4. **Add Environment Variables:**
   Click "Environment Variables" and add these (from your `.env` file):

   ```
   DATABASE_URL = postgresql://postgres:TronSolar2025!@db.ezfbixnfmmdupyyafpja.supabase.co:5432/postgres

   NEXT_PUBLIC_SUPABASE_URL = https://ezfbixnfmmdupyyafpja.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZmJpeG5mbW1kdXB5eWFmcGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDkzNTcsImV4cCI6MjA4MTU4NTM1N30.HcbrXuECQc7tY5K7wx5JQ0uxCChoBucbENGObzgxUMc

   NEXTAUTH_SECRET = your-new-production-secret-here

   NEXTAUTH_URL = https://your-app-name.vercel.app
   ```

   **IMPORTANT:**
   - Generate a NEW `NEXTAUTH_SECRET` for production:
     ```bash
     openssl rand -base64 32
     ```
   - Update `NEXTAUTH_URL` after deployment (Vercel will show you the URL)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

### Step 5: Update NEXTAUTH_URL

1. After deployment, Vercel shows your URL (e.g., `https://tron-inventory.vercel.app`)
2. Go to Vercel Project → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual Vercel URL
4. Redeploy (Vercel → Deployments → click "..." → Redeploy)

### Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Login with: `admin@tronsolar.com` / `admin123`
3. Change the admin password!
4. Create user accounts
5. Test all features

---

## Custom Domain (Optional)

### Add Your Own Domain

1. **In Vercel:**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `inventory.tronsolar.com`)

2. **In Your DNS Provider:**
   - Add the CNAME record Vercel provides
   - Wait for DNS propagation (5-30 minutes)

3. **Update Environment Variable:**
   - Change `NEXTAUTH_URL` to your custom domain
   - Redeploy

---

## Automatic Deployments

**Every time you push to GitHub, Vercel automatically:**
- Builds the app
- Runs tests
- Deploys if successful
- Shows preview URL

**To update your app:**
```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push

# Vercel automatically deploys! ✨
```

---

## Mobile Access

### Option 1: Share the Link
- Give your team the Vercel URL
- They can bookmark it on their phones
- Works perfectly in mobile browsers

### Option 2: Install as PWA (Progressive Web App)

**On iPhone:**
1. Open URL in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Icon appears like a native app!

**On Android:**
1. Open URL in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Icon appears on home screen!

---

## Alternative Hosting Options

### Railway (Good Alternative)
- Similar to Vercel
- Also free tier
- Good Next.js support
- [railway.app](https://railway.app)

### Netlify
- Another Vercel alternative
- Free tier available
- Easy GitHub integration
- [netlify.com](https://netlify.com)

### Render
- Good for full-stack apps
- Free tier (slower)
- [render.com](https://render.com)

---

## ⚠️ IMPORTANT Security Notes

### Before Going Live:

1. **✅ Change Default Admin Password**
   - Login as admin
   - Go to User Management
   - Create new admin with strong password
   - Deactivate default admin

2. **✅ Generate New NEXTAUTH_SECRET**
   - NEVER use the development secret in production
   - Generate with: `openssl rand -base64 32`

3. **✅ Use Environment Variables**
   - NEVER commit `.env` to GitHub (already in `.gitignore`)
   - Use Vercel's environment variables instead

4. **✅ Enable HTTPS**
   - Vercel automatically provides SSL
   - Only access via `https://`

5. **✅ Review User Permissions**
   - Ensure field workers only see their data
   - Warehouse users can't access admin features

---

## Monitoring & Maintenance

### Vercel Analytics (Free)
- View visitor stats
- Monitor performance
- Track errors

### Database Backups
- Supabase automatically backs up daily
- Can restore from Supabase dashboard
- Consider weekly manual backups

### Regular Updates
```bash
# Update dependencies monthly
npm update

# Test locally
npm run dev

# Push to deploy
git push
```

---

## Cost Breakdown

### Vercel Free Tier:
- ✅ Unlimited projects
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL
- ✅ Custom domains
- ✅ More than enough for internal tools!

### Supabase Free Tier:
- ✅ 500 MB database
- ✅ Unlimited API requests
- ✅ Daily backups
- ✅ Perfect for your needs!

**Total Cost: $0/month** 🎉

(If you exceed free tiers, Vercel Pro is $20/month, Supabase Pro is $25/month)

---

## Troubleshooting

### Build Fails on Vercel
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check build logs in Vercel dashboard

### Can't Login After Deployment
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set
- Clear browser cookies and try again

### Database Connection Fails
- Verify DATABASE_URL in Vercel environment variables
- Check Supabase database is running
- Test connection locally first

### Changes Don't Appear
- Make sure you pushed to GitHub
- Check Vercel deployment status
- Clear browser cache
- Try incognito/private window

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs

---

## Quick Command Reference

```bash
# Deploy updates
git add .
git commit -m "Your changes"
git push

# Check deployment status
# Visit: https://vercel.com/dashboard

# View logs
# Click project → Deployments → Latest → View Logs

# Rollback if needed
# Deployments → Previous version → Promote to Production
```

---

**Your app is production-ready and FREE to host! 🚀**
