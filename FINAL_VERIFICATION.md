# Final Verification & Security Audit

**© 2025 Lysara LLC - Proprietary Software**

This document provides a comprehensive verification checklist for the multi-tenant inventory management system, covering tenant isolation, license enforcement, access controls, and IP ownership.

---

## Table of Contents

1. [Tenant Isolation](#tenant-isolation)
2. [License Enforcement](#license-enforcement)
3. [Access Control (Defense in Depth)](#access-control-defense-in-depth)
4. [IP Ownership Markers](#ip-ownership-markers)
5. [Branding & Safety](#branding--safety)
6. [Verification Checklist](#verification-checklist)
7. [License-Gated Routes](#license-gated-routes)

---

## Tenant Isolation

### How Tenant Isolation is Enforced

The system uses a **multi-layered approach** to ensure data cannot leak between companies:

#### 1. Database Level
- All tenant-scoped tables include a required `companyId` foreign key
- Compound unique indexes prevent cross-tenant conflicts:
  - `branches`: `(companyId, name)` - branch names unique per company
  - `users`: `(companyId, vehicleNumber)` - vehicle numbers unique per company
  - `warehouse_inventory`: `(companyId, itemName, branchId)` - inventory items unique per company/branch
  - `vehicle_inventory_items`: `(companyId, itemName)` - vehicle items unique per company
  - `orders`: `(companyId, orderNumber)` - order numbers unique per company
- Cascade deletion: When a company is deleted, all associated data is automatically removed

#### 2. Middleware Level (Prisma)
**File**: `lib/prisma-middleware.ts`

```typescript
export function withCompanyScope(companyId: string) {
  // Automatically injects companyId into all queries
  // Prevents accidental cross-tenant queries
}
```

All API routes use `withCompanyScope()` to ensure queries are automatically scoped to the authenticated user's company.

#### 3. Enforcement Layer
**File**: `lib/enforcement.ts`

```typescript
export async function enforceAll(session, options?) {
  // Validates session exists
  // Enforces role-based access
  // Enforces license status
  // Returns authenticated user's companyId for scoped queries
}
```

#### 4. API Route Level
Every API route follows the pattern:
1. Get session via `getServerSession(authOptions)`
2. Call `enforceAll(session, { role?, feature?, allowReadOnly? })`
3. Use returned `companyId` to scope queries
4. Validate route parameters against session companyId (defense in depth)

**Example** (`app/api/companies/[id]/route.ts`):
```typescript
const { companyId } = await enforceAll(session, { role: 'ADMIN' });

// Explicit validation: Prevent parameter tampering
if (params.id !== companyId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

// Query using authenticated companyId only
const company = await prisma.company.findUnique({
  where: { id: companyId }
});
```

### Email Uniqueness Strategy

**Decision**: Emails are **globally unique** across all companies.

**Rationale**:
- Simplifies login flow (no company selection required)
- One email = one user = one company
- Prevents confusion and account conflicts

**Implementation**:
- `User.email` has `@unique` constraint (global)
- `User.vehicleNumber` has company-scoped uniqueness via `@@unique([companyId, vehicleNumber])`

---

## License Enforcement

### How License Enforcement Works

License enforcement is **server-side only** and integrated into all API routes via the `enforceAll()` function.

#### License States

| Status | Description | Read Access | Write Access |
|--------|-------------|-------------|--------------|
| `ACTIVE` | Fully functional license | ✅ Allowed | ✅ Allowed |
| `TRIAL` | Trial period license | ✅ Allowed | ✅ Allowed |
| `SUSPENDED` | Temporarily suspended | ✅ Optional* | ❌ Blocked |
| `EXPIRED` | License has expired | ✅ Optional* | ❌ Blocked |

*Read access for suspended/expired licenses can be enabled by passing `allowReadOnly: true` to `enforceAll()`

#### License Tiers & Features

**File**: `lib/enforcement.ts`

| Tier | Features |
|------|----------|
| `CORE` | Basic inventory tracking, manual adjustments |
| `OPS` | + Order management, vehicle stock, role-based access |
| `OPS_SCAN` | + Barcode scanning, QR scanning |
| `OPS_SCAN_PO` | + Supplier management, purchase orders, PO compilation |

#### Enforcement in API Routes

**Default Behavior** (Write Operations):
```typescript
// Requires ACTIVE or TRIAL license
const { license } = await enforceAll(session);
```

**Read-Only Mode** (Optional for GET endpoints):
```typescript
// Allows suspended/expired licenses for read-only access
const { license } = await enforceAll(session, {
  allowReadOnly: true
});
```

**Feature-Gated Operations**:
```typescript
// Requires specific tier to access feature
const { license } = await enforceAll(session, {
  feature: 'purchaseOrders' // Only available in OPS_SCAN_PO tier
});
```

#### What Happens When License is Inactive?

1. **Write Operations** (POST, PUT, PATCH, DELETE): Immediately blocked with error
2. **Read Operations** (GET): Configurable - can allow read-only access or block entirely
3. **UI**: Features can be hidden based on license status (but enforcement is server-side)

**Error Response Example**:
```json
{
  "error": "License is suspended. Please contact support.",
  "status": 403
}
```

---

## Access Control (Defense in Depth)

### Server-Side Protection

The system implements **multiple layers** of access control:

#### Layer 1: Layout-Level Protection

**Settings Page** (`app/dashboard/settings/layout.tsx`):
```typescript
export default async function SettingsLayout({ children }) {
  const session = await getServerSession(authOptions);

  // Server-side ADMIN role enforcement
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
```

- Runs on server before page renders
- Non-ADMIN users redirected before any client code executes
- **Cannot be bypassed** by client-side manipulation

#### Layer 2: API Route Protection

All mutating API routes enforce:
1. **Authentication**: Session must exist
2. **Role**: User must have required role (ADMIN/WAREHOUSE/FIELD)
3. **License**: License must be active (or trial)
4. **Feature Tier**: Tier must support the requested feature (optional)

**Example** (`app/api/users/route.ts` - User creation):
```typescript
const { companyId } = await enforceAll(session, {
  role: 'ADMIN', // Only admins can create users
});
// License check is automatic - write operations blocked if license inactive
```

#### Layer 3: Parameter Validation

All API routes with parameters validate them against the authenticated user's context:

```typescript
// app/api/companies/[id]/route.ts
if (params.id !== companyId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

This prevents **parameter tampering** where a malicious user might try to access another company's data by guessing IDs.

#### Layer 4: Database Constraints

- Foreign key constraints enforce referential integrity
- Unique constraints prevent duplicate data within a company
- NOT NULL constraints on `companyId` prevent orphaned records

### Role-Based Access Matrix

| Route | ADMIN | WAREHOUSE | FIELD |
|-------|-------|-----------|-------|
| `/api/users` (GET/POST) | ✅ | ❌ | ❌ |
| `/api/companies/[id]` (GET/PATCH) | ✅ | ❌ | ❌ |
| `/api/licenses/[companyId]` (GET) | ✅ | ✅ | ✅ |
| `/api/inventory` (GET/PATCH) | ✅ | ✅ | ❌ |
| `/api/orders` (GET) | ✅ | ✅ | ✅* |
| `/api/orders` (POST) | ❌ | ❌ | ✅ |
| `/api/vehicle-stock` (GET/POST) | ✅ | ✅ | ✅ |
| `/dashboard/settings` | ✅ | ❌ | ❌ |

*FIELD users can only see their own orders

---

## IP Ownership Markers

### Where IP Ownership is Declared

Lysara LLC ownership is marked in the following locations:

#### 1. User Interface

**File**: `app/dashboard/layout.tsx`

Footer displayed on all dashboard pages:
```
© 2025 Lysara LLC. All rights reserved.
Licensed software. Unauthorized use or distribution prohibited.
```

- Non-intrusive placement
- Visible to all authenticated users
- Cannot be removed without code modification

#### 2. Documentation

**File**: `README.md`

Ownership section at bottom:
```markdown
## Ownership & Copyright

**© 2025 Lysara LLC**

This software is proprietary and confidential.
Developed and maintained by Lysara LLC.

All rights reserved. This software is licensed to authorized parties only.
Unauthorized copying, modification, distribution, or use is strictly prohibited.
```

#### 3. Source Code Headers

Proprietary headers added to core files:

**Files**:
- `app/layout.tsx` (root entry point)
- `app/dashboard/settings/layout.tsx` (ADMIN protection)
- `lib/prisma.ts` (database client)
- `lib/enforcement.ts` (license & access control)

**Header Format**:
```typescript
/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */
```

### Legal Protection

- **Copyright**: © 2025 Lysara LLC establishes ownership
- **Proprietary Notice**: Clarifies software is not open source
- **License Restriction**: "Licensed to authorized parties only"
- **Distribution Prohibition**: "Unauthorized use or distribution prohibited"

**This is closed-source proprietary software, not open source.**

---

## Branding & Safety

### Dynamic Branding Implementation

#### CSS Variables

Primary color is applied globally via CSS variables:

**File**: `components/Navigation.tsx`
```typescript
useEffect(() => {
  if (branding.primaryColor) {
    document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
  } else {
    // Fallback to default Tron orange if no primary color set
    document.documentElement.style.setProperty('--color-primary', '#FF6B35');
  }
}, [branding.primaryColor]);
```

**Usage in Tailwind**:
```tsx
className="text-[var(--color-primary,#FF6B35)]"
className="border-[var(--color-primary,#FF6B35)]"
```

- First value: CSS variable `--color-primary`
- Second value: Fallback to `#FF6B35` (Tron orange) if variable not set

#### Logo Safety

**File**: `components/Navigation.tsx`

```tsx
{branding.logoUrl ? (
  <img
    src={branding.logoUrl}
    alt={`${branding.companyName} Logo`}
    className="h-12 w-auto max-w-[120px] object-contain"
    onError={(e) => {
      // Fallback to default logo on error
      e.currentTarget.src = '/tron-logo.webp';
    }}
  />
) : (
  <Image
    src="/tron-logo.webp"
    alt={branding.appName}
    width={120}
    height={48}
    className="h-12 w-auto"
  />
)}
```

**Safety Features**:
- Checks if `logoUrl` exists before rendering
- `onError` handler catches broken images and falls back to default
- Max width constraint prevents layout breaking
- `object-contain` prevents image distortion

**Settings Preview** (`app/dashboard/settings/page.tsx`):
```tsx
{branding.logoUrl && (
  <img
    src={branding.logoUrl}
    alt="Company Logo"
    className="h-12 object-contain"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
)}
```

- Only renders if logo exists
- Hides image on error instead of showing broken icon

---

## Verification Checklist

### Tenant Isolation

- [ ] **Unique Email Test**: Attempt to create user with existing email from different company
  - Expected: HTTP 409 Conflict
  - Error: "Email address is already in use"

- [ ] **Cross-Tenant Query Test**: Attempt to access another company's data via API
  - Expected: HTTP 403 Forbidden or 404 Not Found
  - Error: "Access denied" or empty results

- [ ] **Parameter Tampering Test**: Modify route parameters (e.g., company ID) in API request
  - Expected: HTTP 403 Forbidden
  - Error: "Access denied. You can only view your own company."

- [ ] **Vehicle Number Uniqueness**: Create two users with same vehicle number in same company
  - Expected: Database constraint error
  - Create users with same vehicle number in **different** companies
  - Expected: Success (vehicle numbers are company-scoped)

### License Enforcement

- [ ] **Active License - Write Test**: With ACTIVE license, create a new order
  - Expected: Success (HTTP 200/201)

- [ ] **Suspended License - Write Test**: Manually set license status to SUSPENDED, attempt to create order
  - Expected: HTTP 403 Forbidden
  - Error: "License is suspended. Please contact support."

- [ ] **Expired License - Write Test**: Set license `expiresAt` to past date, attempt to update inventory
  - Expected: HTTP 403 Forbidden
  - Error: "License has expired. Please renew your subscription."

- [ ] **Trial License - Full Access**: With TRIAL license, test all write operations
  - Expected: Success (trial licenses have full access)

- [ ] **Feature Tier Test**: With CORE tier license, attempt to access OPS-only feature
  - Expected: HTTP 403 Forbidden
  - Error: "Feature 'orderManagement' is not available in your CORE plan."

- [ ] **Read-Only Mode Test**: With suspended license, access GET endpoints
  - Routes with `allowReadOnly: true` should succeed
  - Routes without should fail with license error

### Access Control

- [ ] **Non-ADMIN Settings Access**: Log in as WAREHOUSE user, navigate to `/dashboard/settings`
  - Expected: Immediate redirect to `/dashboard`
  - Settings page should **never render**

- [ ] **Non-ADMIN Settings API**: As WAREHOUSE user, attempt PATCH to `/api/companies/[id]`
  - Expected: HTTP 403 Forbidden
  - Error: "Access denied. Required role: ADMIN"

- [ ] **FIELD User Restrictions**: As FIELD user, attempt to access `/api/users`
  - Expected: HTTP 403 Forbidden
  - Can access own orders: `/api/orders?userId={self}`
  - Cannot see other users' orders

- [ ] **Unauthenticated Access**: Make API request without session
  - Expected: HTTP 401 Unauthorized
  - Error: "Authentication required"

### Branding

- [ ] **Primary Color Update**: As ADMIN, change primary color to `#0000FF` (blue)
  - Save settings
  - Refresh page
  - Expected: All accent colors change to blue (nav links, buttons, borders)

- [ ] **Logo URL Update**: Change logo URL to valid image
  - Expected: Custom logo displays in navigation
  - Change to invalid URL
  - Expected: Falls back to default `/tron-logo.webp`

- [ ] **App Name Update**: Change app name to "Custom Inventory"
  - Expected: New name displays in navigation and page titles

- [ ] **Empty Branding Values**: Remove all branding values
  - Expected: System falls back to defaults (Tron orange, default logo, default name)
  - No broken layouts or missing images

### IP Ownership

- [ ] **Footer Visibility**: Navigate to any dashboard page
  - Expected: Footer displays "© 2025 Lysara LLC. All rights reserved..."

- [ ] **README Ownership**: Open README.md
  - Expected: Ownership section clearly states "© 2025 Lysara LLC"
  - Includes proprietary notice and distribution prohibition

- [ ] **Source Code Headers**: Check core files listed above
  - Expected: Proprietary header present at top of each file

---

## License-Gated Routes

### Routes with License Enforcement

All routes below **automatically block write operations** when license is inactive (SUSPENDED/EXPIRED):

#### User Management
- `POST /api/users` - Create user (ADMIN only)
  - License: Required ACTIVE or TRIAL
  - Role: ADMIN

#### Company Settings
- `PATCH /api/companies/[id]` - Update branding (ADMIN only)
  - License: Required ACTIVE or TRIAL
  - Role: ADMIN

#### Inventory Management
- `PATCH /api/inventory` - Update warehouse inventory (ADMIN/WAREHOUSE)
  - License: Required ACTIVE or TRIAL
  - Role: ADMIN or WAREHOUSE

#### Order Management
- `POST /api/orders` - Create new order (FIELD only)
  - License: Required ACTIVE or TRIAL
  - Role: FIELD
  - Feature: `orderManagement` (requires OPS tier or higher)

#### Vehicle Stock
- `POST /api/vehicle-stock` - Submit vehicle inventory (FIELD)
  - License: Required ACTIVE or TRIAL
  - Role: FIELD
  - Feature: `vehicleStock` (requires OPS tier or higher)

#### Password Updates
- `POST /api/update-password` - Change user password (any authenticated user)
  - License: Required ACTIVE or TRIAL
  - Role: Any authenticated user

### Routes Optionally Allowing Read-Only Access

These routes can be configured to allow read access even with inactive licenses by passing `allowReadOnly: true` to `enforceAll()`:

- `GET /api/companies/[id]` - View company branding
- `GET /api/licenses/[companyId]` - View license info
- `GET /api/inventory` - View warehouse inventory (currently blocks inactive licenses)
- `GET /api/orders` - View orders (currently blocks inactive licenses)
- `GET /api/vehicle-stock` - View vehicle stock (currently blocks inactive licenses)

**Note**: Currently, all GET endpoints require active licenses. To enable read-only mode for specific endpoints, add `allowReadOnly: true` to the `enforceAll()` call.

---

## Summary

### Security Layers Implemented

1. ✅ **Database Constraints**: Company-scoped unique indexes, foreign keys, NOT NULL constraints
2. ✅ **Prisma Middleware**: Automatic company scoping for all queries
3. ✅ **Enforcement Layer**: `enforceAll()` validates session, role, and license
4. ✅ **API Route Guards**: Explicit parameter validation, scoped queries
5. ✅ **Server-Side Layouts**: Page-level role enforcement (Settings for ADMIN only)
6. ✅ **License Enforcement**: All write operations blocked when license inactive

### IP Protection Implemented

1. ✅ **UI Footer**: Copyright notice on all dashboard pages
2. ✅ **README**: Comprehensive ownership and proprietary notice
3. ✅ **Source Headers**: Proprietary markers in core infrastructure files

### Branding Safety Implemented

1. ✅ **CSS Variables**: Centralized color theming with fallbacks
2. ✅ **Logo Fallbacks**: Error handling prevents broken images
3. ✅ **Layout Protection**: Max width and object-contain prevent breaking

### No New Features Added

This phase focused exclusively on:
- Defense-in-depth security
- License enforcement hardening
- IP ownership markers
- Branding safety

**No new product features, payments, or self-serve signup were added.**

---

**Document Version**: 1.0
**Last Updated**: 2025-12-18
**Maintained by**: Lysara LLC
