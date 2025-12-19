# Multi-Tenant Company Layer Implementation

## Overview
This document tracks the implementation of multi-tenant architecture with company-level isolation, branding, and license gating.

## ✅ Phase 1: Database & Auth (COMPLETED)

### Schema Changes
- ✅ Created `Company` model with branding fields:
  - `id`, `name`, `slug`, `logoUrl`, `primaryColor`, `appName`
- ✅ Created `License` model with tier-based gating:
  - Tiers: CORE, OPS, OPS_SCAN, OPS_SCAN_PO
  - Status: TRIAL, ACTIVE, SUSPENDED, EXPIRED
- ✅ Created `InventoryTransaction` model for audit trail
- ✅ Added `companyId` to all tenant models:
  - User, Branch, WarehouseInventory, VehicleInventoryItem
  - VehicleStock, Order
- ✅ Updated unique constraints to be company-scoped

### Auth & Session
- ✅ Added `companyId` to NextAuth session types
- ✅ Updated JWT and session callbacks to include `companyId`

### Middleware & Utilities
- ✅ Created Prisma middleware for automatic company scoping
- ✅ Created `withCompanyScope()` helper function

### Hooks
- ✅ `useCompany()` - Loads company branding (logo, colors, app name)
- ✅ `useLicense()` - Loads license and provides feature flags

### Migrations
- ✅ Created SQL migration: `20251218_add_multi_tenant_company_layer/migration.sql`
- ✅ Created data migration script: `migrate-to-multi-tenant.ts`
  - Creates "Tron Solar" company
  - Creates default OPS license (ACTIVE, no expiry)
  - Backfills all existing data with Tron Solar company ID
  - Adds foreign key constraints

## 🚧 Phase 2: API Endpoints & Admin UI (IN PROGRESS)

### API Endpoints Needed
- ⏳ `GET /api/companies/[id]` - Get company details
- ⏳ `PATCH /api/companies/[id]` - Update company branding (admin only)
- ⏳ `GET /api/licenses/[companyId]` - Get license details
- ⏳ `PATCH /api/licenses/[companyId]` - Update license (SQL only for now)

### Admin Settings UI
- ⏳ Create `/app/dashboard/settings/page.tsx`
  - View/edit company name, logo URL, primary color
  - View license status and tier (read-only)
  - Admin role gate

### UI Updates
- ⏳ Update Navigation/Header to use dynamic branding
- ⏳ Apply primary color to theme
- ⏳ Show app name in title/header
- ⏳ Add license status indicator for admins

## 📋 Phase 3: Migration & Verification (PENDING)

### Migration Steps
1. ⏳ Run initial SQL migration
2. ⏳ Generate Prisma client
3. ⏳ Run data migration script
4. ⏳ Verify data integrity

### Verification Checklist
- ⏳ All records have `companyId` populated
- ⏳ Foreign keys properly enforced
- ⏳ Company scoping middleware works correctly
- ⏳ Cross-company queries blocked
- ⏳ License gating blocks features correctly

## 🎯 Feature Gating by Tier

### CORE Tier
- Basic inventory tracking
- Manual adjustments

### OPS Tier (Current Tron Solar)
- All CORE features
- Order management
- Vehicle stock tracking
- Role-based access (ADMIN, WAREHOUSE, FIELD)

### OPS_SCAN Tier
- All OPS features
- Barcode scanning (UI hidden for now)
- QR code scanning (UI hidden for now)

### OPS_SCAN_PO Tier
- All OPS_SCAN features
- Supplier management (not implemented yet)
- Purchase order compilation (not implemented yet)

## 📝 Migration Commands

### Run Migrations
```bash
# Step 1: Run SQL migration
npx prisma migrate deploy

# Step 2: Generate Prisma client
npx prisma generate

# Step 3: Run data migration
npx ts-node prisma/migrations/migrate-to-multi-tenant.ts

# Step 4: Verify
npx ts-node prisma/migrations/verify-multi-tenant.ts
```

## 🔒 Security Notes

- **Prisma Middleware**: Auto-scopes all queries by `companyId`
- **Supabase RLS**: Defense-in-depth enforcement layer (to be implemented)
- **Session-based scoping**: Company ID from authenticated user session
- **Foreign key cascades**: Deleting company cascades to all related data

## 🚨 Breaking Changes

### Schema
- All tenant models now require `companyId`
- Unique constraints changed to include `companyId`
- Examples:
  - `Branch.name`: `name` → `[companyId, name]`
  - `Order.orderNumber`: `orderNumber` → `[companyId, orderNumber]`
  - `VehicleInventoryItem.itemName`: `itemName` → `[companyId, itemName]`

### API
- All queries must be scoped using `withCompanyScope(companyId)`
- Session now includes `companyId` field

### UI
- Components must use `useCompany()` for branding
- Feature gates must check `useLicense().features.featureName`

## 📚 Usage Examples

### Scoped Prisma Queries
```typescript
import { withCompanyScope } from '@/lib/prisma-middleware';

// In API route
const session = await getServerSession(authOptions);
const scopedPrisma = withCompanyScope(session.user.companyId);

// All queries automatically filtered by companyId
const users = await scopedPrisma.user.findMany();
const orders = await scopedPrisma.order.findMany();
```

### Dynamic Branding
```typescript
import { useCompany } from '@/hooks/useCompany';

function Header() {
  const { branding, loading } = useCompany();

  return (
    <header style={{ backgroundColor: branding.primaryColor }}>
      <h1>{branding.appName}</h1>
      {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" />}
    </header>
  );
}
```

### Feature Gating
```typescript
import { useLicense } from '@/hooks/useLicense';

function SupplierManagement() {
  const { features, isActive } = useLicense();

  if (!isActive) {
    return <div>License inactive. Please contact support.</div>;
  }

  if (!features.supplierManagement) {
    return <div>This feature requires OPS_SCAN_PO tier.</div>;
  }

  return <div>Supplier management UI...</div>;
}
```

## 🐛 Known Issues / TODOs

1. Need to update all existing API routes to use scoped Prisma client
2. Need to handle company creation (SQL-only for now)
3. Supabase RLS policies not yet implemented
4. Seed scripts need updating to use companyId
5. No UI for license expiry warnings yet

## 📊 Current Status

**Completion: ~60%**

- ✅ Database schema
- ✅ Auth & session
- ✅ Middleware
- ✅ Hooks
- ⏳ API endpoints (0/4)
- ⏳ Admin UI (0/1)
- ⏳ Dynamic branding UI (0%)
- ⏳ Migrations run (0%)
- ⏳ Verification (0%)
