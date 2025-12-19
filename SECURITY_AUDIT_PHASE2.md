# Phase 2 Security Audit & Implementation Plan

## 1. Supabase Client Usage Analysis

### Finding: NO Direct Supabase Client Usage ✅
**Analysis Result**: The application uses **Prisma ORM exclusively** for all database operations.

- **Database Access**: All queries go through Prisma Client (`@prisma/client`)
- **Connection**: Prisma connects to Supabase PostgreSQL via `DATABASE_URL`
- **No Supabase-JS**: No usage of `@supabase/supabase-js` client library

### Implication for RLS
Since we're using Prisma (not Supabase client):
- **Supabase RLS policies will NOT be enforced** (Prisma uses direct PostgreSQL connection)
- **Company isolation MUST rely entirely on application-level middleware**
- **Defense-in-depth strategy**: Add database-level CHECK constraints as backup

### Recommended Actions
1. ✅ Use Prisma middleware for company scoping (already implemented)
2. ⚠️ Add PostgreSQL CHECK constraints for defense-in-depth
3. ⚠️ Consider switching to Supabase client if RLS enforcement is critical
4. ✅ Add comprehensive server-side validation

---

## 2. Prisma Middleware Scope Coverage

### Current Implementation Review
File: `lib/prisma-middleware.ts`

#### Operations Covered ✅
- `findUnique` / `findUniqueOrThrow`
- `findFirst` / `findFirstOrThrow`
- `findMany`
- `count`
- `aggregate`
- `groupBy`
- `create`
- `createMany`
- `update` / `updateMany`
- `delete` / `deleteMany`
- `upsert`

#### Potential Gaps ⚠️

1. **Relation Includes**: Need to verify nested queries don't leak data
2. **Raw Queries**: `prisma.$queryRaw` bypasses middleware
3. **Transactions**: Need to ensure scoping works within transactions
4. **Connect/Disconnect**: Relation operations may bypass scoping

### Enhanced Middleware Needed
```typescript
// Additional coverage for:
- connectOrCreate
- connect
- disconnect
- set
- nested creates/updates
```

---

## 3. Unique Constraint Changes

### Business-Critical Constraint Changes

#### Before (Single-Tenant) → After (Multi-Tenant)

| Model | Old Constraint | New Constraint | Business Impact |
|-------|---------------|----------------|-----------------|
| **Branch** | `name` (unique) | `[companyId, name]` | ✅ Different companies CAN have same branch names |
| **User** | `email` (unique) | `email` (unchanged) | ⚠️ **CRITICAL**: Emails still globally unique |
| **User** | `vehicleNumber` (unique) | `vehicleNumber` (unchanged) | ⚠️ **CRITICAL**: Vehicle numbers still globally unique |
| **WarehouseInventory** | `[itemName, branchId]` | `[companyId, itemName, branchId]` | ✅ Different companies CAN have same item names |
| **VehicleInventoryItem** | `itemName` (unique) | `[companyId, itemName]` | ✅ Different companies CAN have same item names |
| **Order** | `orderNumber` (unique) | `[companyId, orderNumber]` | ✅ Different companies CAN have same order numbers |
| **Company** | N/A | `slug` (unique) | ✅ Company slugs globally unique |
| **License** | N/A | `companyId` (unique) | ✅ One license per company |

### ⚠️ CRITICAL BUSINESS DECISIONS NEEDED

**1. User Email Uniqueness**
- **Current**: Emails are globally unique (can't have same email across companies)
- **Question**: Should users be able to work for multiple companies?
- **Options**:
  - Keep global unique (current) - simpler, prevents multi-company users
  - Change to `[companyId, email]` - allows same email across companies

**2. Vehicle Number Uniqueness**
- **Current**: Vehicle numbers globally unique
- **Question**: Can different companies have same vehicle number?
- **Recommendation**: Change to `[companyId, vehicleNumber]` for true isolation

---

## 4. Post-Migration Verification Queries

### SQL Verification Script
```sql
-- 1. Check for NULL companyId (should be 0)
SELECT 'branches' as table_name, COUNT(*) as null_count FROM branches WHERE "companyId" IS NULL
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE "companyId" IS NULL
UNION ALL
SELECT 'warehouse_inventory', COUNT(*) FROM warehouse_inventory WHERE "companyId" IS NULL
UNION ALL
SELECT 'vehicle_inventory_items', COUNT(*) FROM vehicle_inventory_items WHERE "companyId" IS NULL
UNION ALL
SELECT 'vehicle_stocks', COUNT(*) FROM vehicle_stocks WHERE "companyId" IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE "companyId" IS NULL;

-- 2. Verify FK relationships
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid::regclass::text LIKE '%branches%'
    OR conrelid::regclass::text LIKE '%users%'
    OR conrelid::regclass::text LIKE '%warehouse%'
    OR conrelid::regclass::text LIKE '%vehicle%'
    OR conrelid::regclass::text LIKE '%order%')
ORDER BY table_name;

-- 3. Verify all records belong to Tron Solar
SELECT
  'branches' as table_name,
  COUNT(*) as total,
  COUNT(DISTINCT "companyId") as distinct_companies
FROM branches
UNION ALL
SELECT 'users', COUNT(*), COUNT(DISTINCT "companyId") FROM users
UNION ALL
SELECT 'warehouse_inventory', COUNT(*), COUNT(DISTINCT "companyId") FROM warehouse_inventory
UNION ALL
SELECT 'orders', COUNT(*), COUNT(DISTINCT "companyId") FROM orders;

-- 4. Verify Tron Solar company exists
SELECT * FROM companies WHERE slug = 'tron-solar';

-- 5. Verify license
SELECT
  c.name as company_name,
  l.tier,
  l.status,
  l."expiresAt"
FROM licenses l
JOIN companies c ON c.id = l."companyId";

-- 6. Check for orphaned records (should be 0)
SELECT 'branches_orphaned' as issue, COUNT(*) as count
FROM branches b
LEFT JOIN companies c ON b."companyId" = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 'users_orphaned', COUNT(*)
FROM users u
LEFT JOIN companies c ON u."companyId" = c.id
WHERE c.id IS NULL;
```

---

## 5. API Route Inventory & Updates Needed

### Current API Routes (Need Scoping)

| Route | File | Current Status | Needs Update |
|-------|------|----------------|--------------|
| `/api/branches` | `app/api/branches/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/inventory` | `app/api/inventory/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/orders` | `app/api/orders/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/users` | `app/api/users/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/vehicle-stock` | `app/api/vehicle-stock/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/seed` | `app/api/seed/route.ts` | ❌ No scoping | ✅ Special handling |
| `/api/update-password` | `app/api/update-password/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |
| `/api/debug-user` | `app/api/debug-user/route.ts` | ❌ No scoping | ✅ Add `withCompanyScope` |

### New API Routes (To Create)

| Route | Purpose | Auth Required | Role Required |
|-------|---------|---------------|---------------|
| `GET /api/companies/[id]` | Get company details | ✅ Yes | Any (own company only) |
| `PATCH /api/companies/[id]` | Update branding | ✅ Yes | ADMIN only |
| `GET /api/licenses/[companyId]` | Get license | ✅ Yes | Any (own company only) |

---

## 6. Server-Side Enforcement Strategy

### Enforcement Layers

#### Layer 1: Session Validation
```typescript
// Every API route
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

#### Layer 2: Company Scoping
```typescript
// Automatically scope all queries
const scopedPrisma = withCompanyScope(session.user.companyId);
```

#### Layer 3: Role-Based Access
```typescript
// Check user role
if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### Layer 4: License Status Check
```typescript
// Check license active
const license = await scopedPrisma.license.findUnique({
  where: { companyId: session.user.companyId }
});

if (license.status !== 'ACTIVE' && license.status !== 'TRIAL') {
  return NextResponse.json({ error: 'License inactive' }, { status: 402 });
}
```

#### Layer 5: Feature Tier Check
```typescript
// Check feature available in tier
if (!hasFeature(license.tier, 'supplierManagement')) {
  return NextResponse.json({ error: 'Feature not available in your tier' }, { status: 403 });
}
```

### Helper Functions Needed

```typescript
// lib/enforcement.ts
export function hasFeature(tier: LicenseTier, feature: string): boolean {
  const tierFeatures = {
    CORE: ['inventoryTracking', 'manualAdjustments'],
    OPS: ['inventoryTracking', 'manualAdjustments', 'orderManagement', 'vehicleStock'],
    OPS_SCAN: ['inventoryTracking', 'manualAdjustments', 'orderManagement', 'vehicleStock', 'scanning'],
    OPS_SCAN_PO: ['inventoryTracking', 'manualAdjustments', 'orderManagement', 'vehicleStock', 'scanning', 'supplierManagement', 'purchaseOrders'],
  };

  return tierFeatures[tier]?.includes(feature) || false;
}

export async function enforceLicense(companyId: string, requiredFeature?: string) {
  const license = await prisma.license.findUnique({
    where: { companyId }
  });

  if (!license) throw new Error('No license found');

  // Check status
  if (license.status !== 'ACTIVE' && license.status !== 'TRIAL') {
    throw new Error('License inactive');
  }

  // Check expiry
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    throw new Error('License expired');
  }

  // Check feature
  if (requiredFeature && !hasFeature(license.tier, requiredFeature)) {
    throw new Error(`Feature '${requiredFeature}' not available in tier ${license.tier}`);
  }

  return license;
}
```

---

## 7. Migration Safety Checklist

### Pre-Migration

- [ ] Backup production database
- [ ] Test migration on staging database
- [ ] Verify Prisma Client generation succeeds
- [ ] Review all SQL changes manually
- [ ] Confirm zero downtime migration path

### During Migration

- [ ] Run initial SQL migration (creates tables, adds columns)
- [ ] Generate new Prisma Client
- [ ] Run data migration script (backfills companyId)
- [ ] Verify zero NULL companyId values
- [ ] Add NOT NULL constraints
- [ ] Add foreign keys
- [ ] Verify FK relationships

### Post-Migration

- [ ] Run verification queries
- [ ] Test multi-tenant isolation (create test company)
- [ ] Test cross-company query blocking
- [ ] Verify license gating
- [ ] Test all API routes
- [ ] Monitor error logs

---

## 8. Implementation Order (Phase 2)

### Step 1: Enhanced Middleware & Enforcement (Priority 1)
- [ ] Fix unique constraint issues (email, vehicleNumber)
- [ ] Enhance Prisma middleware for relation scoping
- [ ] Create enforcement helper functions
- [ ] Add CHECK constraints for defense-in-depth

### Step 2: Update Existing API Routes (Priority 1)
- [ ] Update `/api/branches`
- [ ] Update `/api/inventory`
- [ ] Update `/api/orders`
- [ ] Update `/api/users`
- [ ] Update `/api/vehicle-stock`
- [ ] Update `/api/update-password`
- [ ] Update `/api/debug-user`
- [ ] Update `/api/seed` (special case)

### Step 3: Create New API Endpoints (Priority 2)
- [ ] Create `/api/companies/[id]` (GET, PATCH)
- [ ] Create `/api/licenses/[companyId]` (GET)

### Step 4: Admin UI & Branding (Priority 3)
- [ ] Create admin settings page
- [ ] Update navigation with dynamic branding
- [ ] Apply theme colors
- [ ] Add license status indicator

### Step 5: Verification & Testing (Priority 1)
- [ ] Create verification script
- [ ] Create test suite for multi-tenant isolation
- [ ] Test license gating
- [ ] Security penetration testing

---

## 9. Critical Security Questions

### Question 1: Email Uniqueness
**Current**: Emails globally unique across all companies
**Recommendation**: Change to `[companyId, email]` for true multi-tenancy
**Impact**: Users could have same email in different companies

### Question 2: Vehicle Number Uniqueness
**Current**: Vehicle numbers globally unique
**Recommendation**: Change to `[companyId, vehicleNumber]`
**Impact**: Different companies could have vehicle #101

### Question 3: RLS vs Middleware
**Current**: Relying on Prisma middleware only
**Recommendation**: Add PostgreSQL CHECK constraints as backup
**Impact**: Defense-in-depth, prevents accidental data leaks

---

## Next Actions

**IMMEDIATE (Before Migration)**:
1. Decide on email/vehicle uniqueness constraints
2. Enhance Prisma middleware for relations
3. Add CHECK constraints to database
4. Create verification script

**PHASE 2A (Core Security)**:
1. Update all API routes with scoping
2. Add server-side enforcement
3. Create enforcement helpers

**PHASE 2B (New Features)**:
1. Company/license endpoints
2. Admin UI
3. Dynamic branding

**PHASE 2C (Verification)**:
1. Run verification
2. Security testing
3. Production migration
