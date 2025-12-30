# Enhanced Signup Wizard & Distribution Model Implementation

## 🎉 What We've Built

This implementation adds a comprehensive multi-step signup wizard and full support for beer distribution business models alongside the existing warehouse operations.

---

## ✅ Completed Features

### 1. Database Schema Updates

**New Enums:**
- `UserRole`: Added `SALES_REP`, `DRIVER`, `CUSTOMER_USER`
- `BusinessModel`: `WAREHOUSE_ONLY`, `DISTRIBUTION`, `HYBRID`
- `LicenseTier`: Added `DISTRIBUTION` ($149.99/mo)
- `CustomerStatus`, `CustomerOrderStatus`, `CustomerOrderType`, `DeliveryStatus`

**New Models for Distribution:**
- `Customer` - Beer retailers, restaurants, bars with account management
- `CustomerParLevel` - Par levels for customer inventory
- `CustomerInventory` - Track customer stock levels
- `Route` - Delivery routes with driver assignments
- `CustomerOrder` - Orders for customer delivery with full workflow
- `CustomerOrderItem` - Line items with delivered/returned quantities
- `DeliveryOrder` - Delivery tracking with signatures and timestamps

**Enhanced Existing Models:**
- `Company`: Added `businessModel` field (supports multi-select via HYBRID)
- `User`: Added fields for sales reps, drivers, and customer users
- `WarehouseInventory`: Relations to customer inventory and orders
- `License`: DISTRIBUTION tier support

### 2. Multi-Step Signup Wizard

**Location:** `/signup/wizard`

**Steps:**
1. **Tier Selection** - Choose BASE ($49.99), ELITE ($99.99), or DISTRIBUTION ($149.99)
2. **Company Info** - Company name, admin account creation
3. **Business Model Selection** - Multi-select support:
   - WAREHOUSE_ONLY (traditional)
   - DISTRIBUTION (beer distribution)
   - HYBRID (both models - auto-selected when both are chosen)
4. **Branch Setup** - Add multiple locations (tier-limited)
5. **User Setup** - Bulk add team members with roles
6. **Review & Checkout** - Summary and Stripe checkout

**Features:**
- Beautiful progress indicator
- Tier-based limits enforcement
- Role filtering based on business model
- Pricing calculation for add-ons
- Future-proof for pricing updates (noted in UI)

### 3. API Endpoints

**New:**
- `POST /api/signup/wizard` - Handles wizard signup with bulk creation
  - Creates Stripe checkout session
  - Stores setup data in subscription metadata
  - Calculates add-on pricing

**Updated:**
- `POST /api/webhooks/stripe` - Enhanced to support wizard data
  - `handleWizardCheckout()` - Creates company, branches, users from wizard
  - `handleLegacyCheckout()` - Maintains backward compatibility
  - Automatic detection of wizard vs legacy signup

### 4. License & Enforcement Updates

**`lib/enforcement.ts`:**
- Added DISTRIBUTION tier features:
  - `customerManagement`
  - `routeManagement`
  - `deliveryTracking`
  - `salesRepTools`
  - `driverApp`
  - `customerPortal`
- Updated tier limits:
  - DISTRIBUTION: 10 branches, unlimited users, $149.99/mo

### 5. File Structure

```
app/
├── signup/
│   ├── page.tsx (redirects to wizard)
│   ├── page_legacy.tsx.bak (old signup for reference)
│   └── wizard/
│       ├── page.tsx (main wizard component)
│       └── steps/
│           ├── TierSelection.tsx
│           ├── CompanyInfo.tsx
│           ├── BusinessModelSelection.tsx
│           ├── BranchSetup.tsx
│           ├── UserSetup.tsx
│           └── ReviewCheckout.tsx
├── api/
│   ├── signup/
│   │   └── wizard/
│   │       └── route.ts (wizard signup API)
│   └── webhooks/
│       └── stripe/
│           └── route.ts (updated webhook handler)
prisma/
└── schema.prisma (updated with all new models)
lib/
└── enforcement.ts (updated with DISTRIBUTION tier)
```

---

## 🚀 How It Works

### Signup Flow

1. User visits `/signup` → Auto-redirects to `/signup/wizard`
2. User completes 6-step wizard
3. Wizard submits to `/api/signup/wizard`
4. API creates:
   - Stripe customer
   - Stripe checkout session with setup data in metadata
5. User completes payment on Stripe
6. Stripe webhook fires `checkout.session.completed`
7. Webhook creates:
   - Company with business model
   - All branches from wizard
   - Admin user + additional users
   - License with tier and add-ons
8. User redirected to success page
9. User can login and start using the app

### Beer Distribution Workflow

```
Sales Rep → Customer Visit
    ↓
Count Customer Inventory (CustomerInventory)
    ↓
Calculate Needed Items (parLevel - currentQty)
    ↓
Create Customer Order (CustomerOrder)
    ↓
Warehouse Pulls Items (status: PULLED)
    ↓
Load on Truck (status: LOADED, create DeliveryOrder)
    ↓
Driver Marks "Out for Delivery" (status: IN_TRANSIT)
    ↓
Driver Arrives (status: ARRIVED)
    ↓
Driver Completes Delivery with Signature (status: DELIVERED)
    ↓
Update Customer Inventory
```

---

## 🔧 Environment Variables Needed

Add these to your `.env` file:

```bash
# Existing
STRIPE_SECRET_KEY=sk_...
STRIPE_BASE_PRICE_ID=price_...
STRIPE_ELITE_PRICE_ID=price_...

# New - Required for Distribution tier
STRIPE_DISTRIBUTION_PRICE_ID=price_...  # $149.99/mo plan

# Add-ons (optional - for future pricing)
STRIPE_BRANCH_PRICE_ID=price_...  # $19.99/mo per branch
STRIPE_USER_PRICE_ID=price_...    # $1/mo per user
```

---

## 📋 Next Steps (To Be Built)

### Phase 1: Customer Management (Priority)
- [ ] `/dashboard/customers` - Customer list and CRUD
- [ ] `/dashboard/customers/[id]` - Customer detail with inventory
- [ ] API: `/api/customers`
- [ ] API: `/api/customers/[id]/inventory`
- [ ] API: `/api/customers/[id]/par-levels`

### Phase 2: Route Management
- [ ] `/dashboard/routes` - Route management
- [ ] `/dashboard/my-route` - Driver's route view
- [ ] API: `/api/routes`

### Phase 3: Order Workflows
- [ ] `/dashboard/customer-orders` - Warehouse view
- [ ] `/dashboard/my-customer-orders` - Sales rep view
- [ ] API: `/api/customer-orders`
- [ ] API: `/api/customer-orders/[id]/pull`
- [ ] API: `/api/customer-orders/[id]/load`

### Phase 4: Delivery Tracking
- [ ] `/dashboard/deliveries` - All deliveries
- [ ] `/dashboard/my-deliveries` - Driver's deliveries
- [ ] API: `/api/deliveries`
- [ ] API: `/api/deliveries/[id]/status`
- [ ] API: `/api/deliveries/[id]/complete`

### Phase 5: Customer Portal
- [ ] `/dashboard/customer-portal` - Self-service for customers
- [ ] Customer login system
- [ ] Order placement by customers

### Phase 6: Navigation & Role-Based Dashboards
- [ ] Update `components/Navigation.tsx` for business model routing
- [ ] Create role-specific dashboards (SALES_REP, DRIVER, etc.)
- [ ] Conditional menu items based on business model

---

## 🎨 Business Model Support

### WAREHOUSE_ONLY (Current Model)
- Warehouse inventory tracking
- Field worker vehicle stock
- Order management for crews
- Part requests
- QR scanning

### DISTRIBUTION (New Beer Distribution Model)
- All WAREHOUSE_ONLY features
- Customer management
- Route planning
- Delivery tracking
- Sales rep tools
- Driver mobile app
- Customer self-service portal

### HYBRID (Both Models)
- Combines all features from both models
- Perfect for companies that do both warehouse operations AND distribution
- Auto-selected when user picks both WAREHOUSE_ONLY and DISTRIBUTION
- Future pricing: Base tier + $50/mo for distribution features (to be configured)

---

## 💰 Pricing Structure

| Tier | Monthly | Branches | Users | Features |
|------|---------|----------|-------|----------|
| **BASE** | $49.99 | 1 | 10 | Core inventory management |
| **ELITE** | $99.99 | 5 | 100 | + PO System, AI BOM Builder, Lana AI |
| **DISTRIBUTION** | $149.99 | 10 | Unlimited | + All distribution features |

**Add-ons:**
- Additional Branch: $19.99/month
- Additional User: $1.00/month
- Multiple Business Models: TBD (noted in UI for future pricing)

**Trial:**
- 14 days free
- No credit card required for trial start
- Full feature access during trial

---

## 🧪 Testing Checklist

- [ ] Test BASE tier signup through wizard
- [ ] Test ELITE tier signup with multiple branches
- [ ] Test DISTRIBUTION tier signup with users
- [ ] Test HYBRID business model selection
- [ ] Verify Stripe checkout session creation
- [ ] Test webhook company creation with wizard data
- [ ] Test legacy signup still works (if needed)
- [ ] Verify tier limits enforcement
- [ ] Test add-on pricing calculation
- [ ] Verify all new database models created correctly

---

## 🐛 Known Considerations

1. **Temporary Passwords**: Additional users created through wizard get random temporary passwords. They'll need to use password reset on first login.

2. **DISTRIBUTION Stripe Price**: If `STRIPE_DISTRIBUTION_PRICE_ID` is not set, it falls back to `STRIPE_ELITE_PRICE_ID`. Make sure to create the DISTRIBUTION price in Stripe.

3. **Business Model Pricing**: UI notes that additional business model pricing will be added later. This is future-proof for when you want to charge for HYBRID mode.

4. **Role Availability**: SALES_REP and DRIVER roles are only available when DISTRIBUTION or HYBRID business model is selected.

---

## 📝 Database Migration

The schema has been updated and pushed to the database using:
```bash
npx prisma db push
npx prisma generate
```

All new models and enums are live and ready to use.

---

## 🎯 Design Decisions

1. **Multi-Select Business Models**: Users can select multiple models, which automatically creates a HYBRID mode. This allows maximum flexibility.

2. **Wizard in Metadata**: All setup data is stored in Stripe subscription metadata, ensuring the webhook has everything needed to create the full company setup.

3. **Backward Compatibility**: Old signup flow is preserved (`handleLegacyCheckout`) so existing code doesn't break.

4. **Tier-Based Feature Gates**: The enforcement library checks both tier AND business model to determine feature availability.

5. **Future-Proof Pricing**: UI explicitly notes where pricing will be added later, so users aren't surprised when it's implemented.

---

## 👨‍💻 Developer Notes

- The wizard uses TypeScript types from Prisma (`@prisma/client`)
- All components use the ocean theme for consistent styling
- Progress indicator shows completion status for each step
- Validation happens at each step before allowing navigation
- The entire wizard state is managed in the parent component

---

**Ready to test!** Visit `/signup` to see the new wizard in action! 🚀
