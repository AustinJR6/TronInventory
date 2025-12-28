# Manifest - Stripe Integration Setup Guide

This guide will help you configure Stripe for the Manifest subscription system.

## Prerequisites

- Active Stripe account
- Stripe API keys (test and production)
- Stripe CLI (for webhook testing)

## Step 1: Environment Variables

Add the following to your `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...  # Replace with your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Replace with your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Stripe webhook signing secret

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL
```

## Step 2: Create Stripe Products & Prices

In your [Stripe Dashboard](https://dashboard.stripe.com/products), create the following products:

### 1. BASE Plan
- **Product Name**: Manifest BASE
- **Pricing**: $49.99/month
- **Billing**: Recurring monthly
- **Copy the Price ID** and add to `.env`:
  ```
  STRIPE_PRICE_BASE=price_xxxxx
  ```

### 2. ELITE Plan
- **Product Name**: Manifest ELITE
- **Pricing**: $99.99/month
- **Billing**: Recurring monthly
- **Copy the Price ID** and add to `.env`:
  ```
  STRIPE_PRICE_ELITE=price_xxxxx
  ```

### 3. Branch Add-On (Optional - for future use)
- **Product Name**: Additional Branch
- **Pricing**: $19.99/month
- **Billing**: Recurring monthly
- **Metered**: No
- **Copy the Price ID** and add to `.env`:
  ```
  STRIPE_PRICE_BRANCH=price_xxxxx
  ```

### 4. User Add-On (Optional - for future use)
- **Product Name**: Additional User
- **Pricing**: $1.00/month
- **Billing**: Recurring monthly
- **Metered**: No
- **Copy the Price ID** and add to `.env`:
  ```
  STRIPE_PRICE_USER=price_xxxxx
  ```

## Step 3: Configure Webhook

### Development (using Stripe CLI)

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe**:
   ```bash
   stripe login
   ```
3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. **Copy the webhook signing secret** (starts with `whsec_`) and add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Production

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy the signing secret** and add to your production `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Step 4: Test the Integration

### 1. Start Development Server
```bash
npm run dev
```

### 2. Start Stripe CLI (in another terminal)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Test Signup Flow
1. Navigate to `http://localhost:3000/signup`
2. Fill out the signup form
3. Select BASE or ELITE plan
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiration date
   - Any 3-digit CVC
   - Any postal code
5. Complete checkout
6. You should be redirected to success page
7. Check your terminal for webhook events
8. Verify account was created in database

### Stripe Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires 3D Secure**: 4000 0025 0000 3155

## Step 5: Verify Database

After successful signup, check your database:

```sql
-- Check company was created
SELECT * FROM companies ORDER BY "createdAt" DESC LIMIT 1;

-- Check license was created
SELECT * FROM licenses ORDER BY "createdAt" DESC LIMIT 1;

-- Check admin user was created
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 1;

-- Check default branch was created
SELECT * FROM branches ORDER BY "createdAt" DESC LIMIT 1;
```

## Pricing Structure

### BASE Plan - $49.99/month
- 1 branch included
- 10 users included
- All features EXCEPT:
  - PO System
  - AI BOM Builder
  - Lana AI Assistant
- Additional branches: $19.99/month each
- Additional users: $1.00/month each
- 14-day free trial

### ELITE Plan - $99.99/month
- 5 branches included
- 100 users included
- ALL features including:
  - PO System
  - AI BOM Builder
  - Lana AI Assistant
- Additional branches: $19.99/month each (beyond 5)
- Additional users: $1.00/month each (beyond 100)
- 14-day free trial

## Webhook Event Handlers

The app handles the following Stripe events:

### `checkout.session.completed`
- Creates company, license, admin user, and default branch
- Sets license status to TRIAL (14-day free trial)
- Links Stripe customer and subscription IDs

### `customer.subscription.updated`
- Updates license status based on subscription status
- Handles tier changes
- Updates billing information

### `customer.subscription.deleted`
- Sets license status to EXPIRED
- Adds expiration date

### `invoice.payment_succeeded`
- Reactivates suspended licenses
- Confirms active subscription

### `invoice.payment_failed`
- Suspends license
- Sends notification (future feature)

## Managing Add-Ons (Future Feature)

To add additional branches or users:

1. Update the subscription in Stripe to include metered items
2. App will track actual usage
3. Invoice will be updated with prorated charges

## Troubleshooting

### Webhook Not Firing
- Ensure Stripe CLI is running
- Check webhook signing secret matches
- Verify endpoint URL is correct

### Account Not Created
- Check webhook logs in terminal
- Verify database connection
- Check for duplicate email/company slug

### Payment Declined
- Use test cards from Stripe documentation
- Check test mode is enabled in Stripe

### License Not Updating
- Check webhook events in Stripe dashboard
- Verify subscription ID matches in database
- Check license enforcement logic

## Going to Production

1. **Switch to Live Keys**:
   - Replace test keys with live keys in `.env`
   - Update `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Update Products**:
   - Create production versions of products in Stripe
   - Update price IDs in `.env`

3. **Configure Production Webhook**:
   - Add production webhook endpoint in Stripe
   - Update `STRIPE_WEBHOOK_SECRET`

4. **Update Base URL**:
   - Set `NEXT_PUBLIC_BASE_URL` to your production domain

5. **Test in Production**:
   - Use real payment method (or create test subscription)
   - Verify webhook receives events
   - Check account creation

## Security Notes

- Never commit `.env` file to git
- Keep webhook secrets secure
- Validate all webhook signatures
- Use HTTPS in production
- Implement rate limiting on signup endpoint

## Support

For Stripe integration issues:
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For Manifest app issues:
- Check application logs
- Review webhook event history in Stripe
- Verify database records match Stripe data
