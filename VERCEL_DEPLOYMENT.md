# Vercel Deployment Guide for Manifest

## 🚨 Current Issue

Your build is failing because Stripe environment variables are missing from Vercel.

**Error**: `STRIPE_SECRET_KEY is not defined in environment variables`

---

## ✅ Step 1: Add Environment Variables to Vercel

### Via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (TronInventory or Manifest)
3. **Click Settings** → **Environment Variables**
4. **Add each variable below**:

#### Required Variables:

```bash
# Stripe API Keys (from your Stripe account)
STRIPE_SECRET_KEY
sk_live_... (your Stripe secret key)

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
pk_live_... (your Stripe publishable key)

# Application URL (replace with your actual Vercel URL)
NEXT_PUBLIC_BASE_URL
https://your-project-name.vercel.app
```

**For each variable:**
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**
- Click **Save**

---

## ✅ Step 2: Create Stripe Products

You need to create products in Stripe and get their Price IDs:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products
2. **Click "Add product"**

### Product 1: Manifest BASE

- **Product Name**: `Manifest BASE`
- **Description**: `1 branch, 10 users - Core features`
- **Pricing Model**: `Standard pricing`
- **Price**: `$49.99`
- **Billing Period**: `Monthly`
- **Click Save**

**Copy the Price ID** (starts with `price_...`)

### Product 2: Manifest ELITE

- **Product Name**: `Manifest ELITE`
- **Description**: `5 branches, 100 users - All features including AI`
- **Pricing Model**: `Standard pricing`
- **Price**: `$99.99`
- **Billing Period**: `Monthly`
- **Click Save**

**Copy the Price ID** (starts with `price_...`)

---

## ✅ Step 3: Add Stripe Price IDs to Vercel ✅ CONFIGURED

**Stripe Products Configured**:

### BASE Plan ($49.99/month)
- Product ID: `prod_Tgp2d3PbUjOLLV`
- Price ID: `price_1SjRNx51SPyj0yYAaqGsdh7B`

### ELITE Plan ($119.99/month)
- Product ID: `prod_Tgp3mb0B48y8aA`
- Price ID: `price_1SjRPp51SPyj0yYAS5isqpHq`

**Environment Variables to Add in Vercel**:

```bash
STRIPE_PRICE_BASE
price_1SjRNx51SPyj0yYAaqGsdh7B

STRIPE_PRICE_ELITE
price_1SjRPp51SPyj0yYAS5isqpHq
```

---

## ✅ Step 4: Set Up Stripe Webhook (Production) ✅ CONFIGURED

**Webhook Endpoint**: `https://tron-inventory.vercel.app/api/webhooks/stripe`

**Status**: ✅ Webhook configured and secret added to Vercel environment variables

**Events configured**:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**To configure a new webhook** (if needed):
1. **Go to Stripe Webhooks**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://tron-inventory.vercel.app/api/webhooks/stripe`
4. **Select the 5 events listed above**
5. **Click "Add endpoint"**
6. **Click the endpoint** to view details
7. **Click "Reveal" under Signing secret**
8. **Copy the webhook secret** (starts with `whsec_...`)

---

## ✅ Step 5: Add Webhook Secret to Vercel ✅ CONFIGURED

**Status**: ✅ Webhook secret has been added to Vercel environment variables

The `STRIPE_WEBHOOK_SECRET` environment variable is configured in Vercel for Production, Preview, and Development environments.

**Note**: For security reasons, the actual webhook secret is stored only in Vercel's environment variables and should never be committed to the repository.

---

## ✅ Step 6: Redeploy

After adding all environment variables:

1. **Go to Vercel Deployments tab**
2. **Click the 3 dots** on the latest deployment
3. **Click "Redeploy"**
4. **Check "Use existing Build Cache"** (optional)
5. **Click "Redeploy"**

**OR** just push a new commit:

```bash
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main
```

---

## 📋 Complete Environment Variables Checklist

Make sure ALL of these are in Vercel:

- [x] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- [x] `STRIPE_PRICE_BASE` - BASE plan price ID from Stripe
- [x] `STRIPE_PRICE_ELITE` - ELITE plan price ID from Stripe
- [x] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
- [x] `NEXT_PUBLIC_BASE_URL` - Your Vercel app URL
- [x] `DATABASE_URL` - Already set (Supabase connection)
- [x] `NEXTAUTH_SECRET` - Already set
- [x] `NEXTAUTH_URL` - Should be your Vercel URL in production
- [x] `OPENAI_API_KEY` - Already set (for ELITE tier AI features)
- [x] `BLOB_READ_WRITE_TOKEN` - Already set (for BOM PDFs)

---

## 🧪 Testing After Deployment

### 1. Test the Signup Flow

1. Go to: `https://your-app.vercel.app/signup`
2. Select a plan (BASE or ELITE)
3. Fill out the form
4. Click "Start Free Trial"
5. You should be redirected to Stripe Checkout
6. Use a test card if in test mode, or real card if in live mode
7. Complete checkout
8. You should be redirected to success page
9. Check your database - a new company, user, license, and branch should be created

### 2. Test the Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click your webhook endpoint
3. You should see successful events listed:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`

### 3. Test Login

1. Go to: `https://your-app.vercel.app/login`
2. Sign in with the email/password you created during signup
3. You should see the Manifest logo and be able to access the dashboard

---

## 🔥 Troubleshooting

### Build Still Failing?

**Check Vercel Build Logs**:
- Go to Vercel → Deployments → Click failed deployment
- Scroll to the error
- Common issues:
  - Missing environment variable → Add it in Settings
  - TypeScript error → Check the logs for the specific error
  - API version mismatch → Make sure Stripe package is up to date

### Webhook Not Firing?

1. Check webhook URL is correct: `https://your-app.vercel.app/api/webhooks/stripe`
2. Check webhook events are selected (5 events listed above)
3. Check webhook secret matches what's in Vercel
4. Test webhook using "Send test webhook" in Stripe Dashboard

### Stripe Checkout Not Working?

1. Make sure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
2. Make sure price IDs are correct
3. Check browser console for errors
4. Verify `NEXT_PUBLIC_BASE_URL` is set to your Vercel URL

---

## 🎯 Quick Start Commands

### If you're using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_PRICE_BASE production
vercel env add STRIPE_PRICE_ELITE production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_BASE_URL production

# Deploy
vercel --prod
```

---

## ✅ Final Checklist Before Going Live

- [ ] All environment variables added to Vercel
- [ ] Stripe products created (BASE and ELITE)
- [ ] Price IDs copied to Vercel
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret copied to Vercel
- [ ] `NEXT_PUBLIC_BASE_URL` set to production URL
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Deployment successful (no build errors)
- [ ] Signup flow tested end-to-end
- [ ] Login works after signup
- [ ] Webhook events showing in Stripe Dashboard
- [ ] Database shows new company/user/license after signup

---

## 🚀 You're Ready!

Once all environment variables are added and the deployment succeeds, your app will be live and ready to accept customers!

**Your signup URL**: `https://your-app.vercel.app/signup`
**Your login URL**: `https://your-app.vercel.app/login`

---

## 💡 Pro Tips

1. **Use Test Mode First**: Switch Stripe to test mode and use test keys to verify everything works before going live
2. **Monitor Webhooks**: Keep an eye on Stripe webhook events to catch any issues early
3. **Set Up Alerts**: Configure Vercel to notify you of deployment failures
4. **Check Logs**: Use Vercel's runtime logs to debug any production issues

---

**Need help?** Check the Stripe documentation or Vercel docs for more details.
