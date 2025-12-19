# Production Migration Steps for Multi-Tenant Implementation

⚠️ **IMPORTANT**: Run these SQL commands in the Vercel production database SQL editor

## Step 1: Apply Multi-Tenant Schema Migration

Run the migration SQL file:
```sql
-- Copy and paste the contents of:
-- prisma/migrations/20251218_add_multi_tenant_company_layer/migration.sql
```

## Step 2: Add Compound Unique Constraints

```sql
-- Warehouse Inventory
ALTER TABLE warehouse_inventory
ADD CONSTRAINT warehouse_inventory_companyId_itemName_branchId_key
UNIQUE ("companyId", "itemName", "branchId");

-- Vehicle Inventory Items
ALTER TABLE vehicle_inventory_items
ADD CONSTRAINT vehicle_inventory_items_companyId_itemName_key
UNIQUE ("companyId", "itemName");

-- Orders
ALTER TABLE orders
ADD CONSTRAINT orders_companyId_orderNumber_key
UNIQUE ("companyId", "orderNumber");

-- Users (vehicle number is company-scoped)
ALTER TABLE users
ADD CONSTRAINT users_companyId_vehicleNumber_key
UNIQUE ("companyId", "vehicleNumber");
```

## Step 3: Clean Up Old Data

⚠️ **WARNING**: This will delete all records with NULL companyId values

Run the cleanup script:
```bash
npx tsx scripts/cleanup-null-companyids.ts
```

OR manually delete old data:
```sql
DELETE FROM orders WHERE "companyId" IS NULL;
DELETE FROM warehouse_inventory WHERE "companyId" IS NULL;
DELETE FROM vehicle_inventory_items WHERE "companyId" IS NULL;
DELETE FROM users WHERE "companyId" IS NULL;
DELETE FROM branches WHERE "companyId" IS NULL;
```

## Step 4: Add NOT NULL Constraints and Foreign Keys

```sql
-- Add NOT NULL constraints
ALTER TABLE branches ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE users ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE warehouse_inventory ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE vehicle_inventory_items ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE vehicle_stocks ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE orders ALTER COLUMN "companyId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE branches
  ADD CONSTRAINT branches_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE users
  ADD CONSTRAINT users_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE warehouse_inventory
  ADD CONSTRAINT warehouse_inventory_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE vehicle_inventory_items
  ADD CONSTRAINT vehicle_inventory_items_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE vehicle_stocks
  ADD CONSTRAINT vehicle_stocks_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT orders_companyId_fkey
  FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE;
```

## Step 5: Seed Production Data

Run the production seed script to create Tron Solar and Test Company:
```bash
npx tsx prisma/seed-production.ts
```

This will create:
- **Tron Solar**: raustinj39@gmail.com / Solar2025!
- **Test Company**: tennant2@outlook.com / Solar2025!

## Step 6: Verify

Run the debug script to verify tenant separation:
```bash
npx tsx scripts/debug-tenants.ts
```

You should see:
- 2 users (one per company)
- 2 branches (one per company)
- Separate warehouse inventory counts per company

## Notes

- All changes are now live on Vercel
- The app will automatically redeploy with the updated code
- Users will see their own company's branding (if configured)
- Complete data isolation between tenants
