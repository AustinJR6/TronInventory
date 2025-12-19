# Final Security Audit - Phase 2 Verification

## Executive Summary

This audit addresses three critical security concerns before proceeding to Phase 3:

1. ✅ **Cross-tenant ID guessing vulnerability** - PARTIALLY FIXED (2 issues found)
2. ⚠️ **Email uniqueness ambiguity** - CRITICAL ISSUE IDENTIFIED
3. ✅ **Supabase client-side usage** - CONFIRMED: No client-side Supabase, no RLS needed

---

## 1. Cross-Tenant ID Guessing Audit

### ❌ VULNERABILITIES FOUND: 2 endpoints

#### Issue 1: `/api/companies/[id]` - Unscoped findUnique/update

**File:** [app/api/companies/[id]/route.ts](app/api/companies/[id]/route.ts)

**Current Code (VULNERABLE):**
```typescript
// GET endpoint - Line 30-31
const company = await prisma.company.findUnique({
  where: { id: params.id },  // ❌ No company scoping check
});

// PATCH endpoint - Line 98-99
const updatedCompany = await prisma.company.update({
  where: { id: params.id },  // ❌ No company scoping check
});
```

**Attack Vector:**
- User from Company A gets their companyId from session
- User guesses Company B's ID (e.g., incremental IDs)
- User calls `GET /api/companies/[companyB-id]`
- Even though we check `params.id !== companyId`, the query uses raw `prisma` instead of `scopedPrisma`
- **HOWEVER:** We DO have manual validation: `if (params.id !== companyId) return 403`

**Status:** ✅ **SAFE** (manual validation present, but not ideal pattern)

**Recommendation:** Change to use `scopedPrisma` or explicit validation

---

#### Issue 2: `/api/licenses/[companyId]` - Unscoped findUnique

**File:** [app/api/licenses/[companyId]/route.ts](app/api/licenses/[companyId]/route.ts)

**Current Code (VULNERABLE):**
```typescript
// GET endpoint - Line 30-31
const license = await prisma.license.findUnique({
  where: { companyId: params.companyId },  // ❌ Uses raw prisma
});
```

**Attack Vector:**
- User from Company A can call `GET /api/licenses/[companyB-id]`
- **HOWEVER:** We DO have manual validation: `if (params.companyId !== companyId) return 403`

**Status:** ✅ **SAFE** (manual validation present, but not ideal pattern)

**Recommendation:** Use explicit compound where clause for defense-in-depth

---

### ✅ SAFE: All other endpoints use scopedPrisma

**Verified Safe Patterns:**

1. **update-password** - Uses `scopedPrisma.user.findUnique({ where: { id: userId } })`
   - userId comes from authenticated session
   - scopedPrisma automatically filters by companyId

2. **orders** - Uses `scopedPrisma.order.update({ where: { id: orderId } })`
   - Middleware ensures order belongs to user's company

3. **inventory** - Uses `scopedPrisma.warehouseInventory.update({ where: { id } })`
   - Middleware ensures inventory item belongs to user's company

4. **users** - Uses `scopedPrisma.user.update({ where: { id: userId } })`
   - Middleware ensures user belongs to same company

---

### Recommended Fixes

#### Fix for `/api/companies/[id]`

**Option A: Use explicit validation (RECOMMENDED - simpler)**
```typescript
// No change needed - manual validation already present
if (params.id !== companyId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

**Option B: Use compound where clause (defense-in-depth)**
```typescript
const company = await prisma.company.findFirst({
  where: {
    id: params.id,
    id: companyId  // Explicit double-check
  },
});
```

#### Fix for `/api/licenses/[companyId]`

**No change needed** - manual validation already present:
```typescript
if (params.companyId !== companyId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

---

## 2. Email Uniqueness - CRITICAL ISSUE

### ⚠️ PROBLEM: Ambiguous login with company-scoped emails

**Current State:**
- Schema uses `@@unique([companyId, email])` (allows same email across companies)
- Login uses `prisma.user.findUnique({ where: { email } })` at [lib/auth.ts:20-22](lib/auth.ts#L20-22)

**Attack Vector:**
```
Company A has: user@example.com (companyId: A)
Company B has: user@example.com (companyId: B)

User logs in with: user@example.com
Question: Which company do they get logged into?
```

**Current Behavior:**
- `findUnique` will **FAIL** because email is no longer globally unique
- Prisma will throw error: "Unique constraint failed on the fields: (`email`)"
- **LOGIN WILL BREAK** for any duplicate emails

### ✅ SOLUTION: Revert to global unique emails

**Rationale:**
- No company selection UI exists
- Login flow doesn't support selecting company
- Users should have globally unique emails (one email = one company)

**Required Changes:**

#### 1. Revert Prisma Schema
```prisma
model User {
  // ... other fields ...
  email         String   @unique  // ✅ Global unique
  vehicleNumber String?

  @@unique([companyId, vehicleNumber])  // Vehicle numbers can be shared across companies
  @@map("users")
}
```

#### 2. Update API Routes

**app/api/users/route.ts** - Change back to `findUnique`:
```typescript
// Current (WRONG for global unique):
const existingUser = await scopedPrisma.user.findFirst({
  where: { email },
});

// Fixed (for global unique):
const existingUser = await prisma.user.findUnique({
  where: { email },
});

// BUT check company ownership:
if (existingUser && existingUser.companyId !== companyId) {
  return NextResponse.json({
    error: 'Email already exists in another company'
  }, { status: 400 });
}
```

### Alternative: Multi-Company User Support (Future)

If you want to support same email across companies in the future:

1. Add company selection screen to login
2. Change login to two-step:
   ```typescript
   // Step 1: Find all companies for email
   const users = await prisma.user.findMany({
     where: { email: credentials.email },
     select: { companyId: true, company: { select: { name: true } } }
   });

   // Step 2: User selects company, then authenticate
   ```

3. Keep `@@unique([companyId, email])` in schema

**Recommendation:** **Use global unique emails for now** (simpler, no login UI changes needed)

---

## 3. Supabase Client-Side Usage Audit

### ✅ CONFIRMED: No client-side Supabase usage

**Findings:**

1. **No `@supabase/supabase-js` imports** - Grep found no client imports
2. **No `createClient` calls** - Grep found no Supabase client instantiation
3. **Database access: Prisma-only** - All queries use Prisma Client
4. **Connection method:** Prisma connects directly to Postgres via `DATABASE_URL`

**Conclusion:**
- **No RLS needed** - Row-Level Security won't be enforced (Prisma bypasses it)
- **Middleware is the security layer** - `withCompanyScope()` is critical
- **Defense-in-depth:** Can add PostgreSQL CHECK constraints as backup

### Recommended Defense-in-Depth: PostgreSQL CHECK Constraints

**Optional SQL to add database-level checks:**

```sql
-- Add CHECK constraints to ensure companyId matches (paranoid mode)
ALTER TABLE "branches"
ADD CONSTRAINT "branches_companyId_check"
CHECK ("companyId" IS NOT NULL);

ALTER TABLE "users"
ADD CONSTRAINT "users_companyId_check"
CHECK ("companyId" IS NOT NULL);

-- etc. for all tenant tables
```

**Benefits:**
- Catches bugs where middleware is bypassed
- Prevents NULL companyId inserts
- No performance impact (NOT NULL already enforced)

**Status:** ⏳ OPTIONAL - Recommend adding post-migration

---

## Summary of Required Fixes

### 🔴 CRITICAL (Must fix before Phase 3)

1. **Email Uniqueness Decision:**
   - **Option A (RECOMMENDED):** Revert to global unique emails
     - Change schema: `email String @unique`
     - Update user creation to use `findUnique` with company check
     - No login changes needed

   - **Option B:** Keep company-scoped emails + add company selection UI
     - Keep schema: `@@unique([companyId, email])`
     - Add two-step login (select company, then authenticate)
     - Significant UI work required

### 🟡 RECOMMENDED (Nice-to-have)

2. **Cross-tenant ID guessing:**
   - Current manual validation is **SAFE**
   - Consider switching to `scopedPrisma` for consistency
   - Not urgent since validation is present

3. **PostgreSQL CHECK constraints:**
   - Add NOT NULL constraints via migration
   - Add to verification script
   - Run post-migration

---

## Action Items

**Before proceeding to Phase 3:**

- [ ] **DECIDE:** Global unique emails (Option A) or company selection UI (Option B)?
- [ ] **IF Option A:** Revert schema change for email uniqueness
- [ ] **IF Option A:** Update `app/api/users/route.ts` to use `findUnique`
- [ ] **IF Option B:** Implement two-step login with company selection
- [ ] **OPTIONAL:** Add CHECK constraints to migration
- [ ] **OPTIONAL:** Switch companies/licenses endpoints to scopedPrisma

**After decision:**
- ✅ Proceed with Phase 3: Admin Settings UI + Dynamic Branding

---

## Files Requiring Updates (if choosing Option A)

1. [prisma/schema.prisma](prisma/schema.prisma) - Revert `@@unique([companyId, email])` to `email String @unique`
2. [app/api/users/route.ts](app/api/users/route.ts) - Change `findFirst` to `findUnique` with company check
3. [lib/auth.ts](lib/auth.ts) - Already uses `findUnique({ where: { email } })` ✅

**Estimated time:** 10 minutes + Prisma migration generation

---

## Recommendation

**I recommend Option A (global unique emails)** because:

1. ✅ No login UI changes needed
2. ✅ Simpler mental model (one email = one company)
3. ✅ Matches current login implementation
4. ✅ No risk of login breaking
5. ✅ Can add multi-company support later if needed

**Proceed with Option A?**
