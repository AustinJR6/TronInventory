-- Migration: Update to Manifest BASE/ELITE pricing structure
-- This migrates from the old CORE/OPS/OPS_SCAN/OPS_SCAN_PO tiers to BASE/ELITE

-- Step 1: Add new fields to licenses table
ALTER TABLE "licenses"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT,
  ADD COLUMN IF NOT EXISTS "includedBranches" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "includedUsers" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "additionalBranches" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "additionalUsers" INTEGER NOT NULL DEFAULT 0;

-- Step 2: Create new enum type
CREATE TYPE "LicenseTier_new" AS ENUM ('BASE', 'ELITE');

-- Step 3: Migrate existing data
-- CORE and OPS -> BASE
-- OPS_SCAN and OPS_SCAN_PO -> ELITE
UPDATE "licenses"
SET
  "includedBranches" = CASE
    WHEN tier::text IN ('OPS_SCAN_PO') THEN 5
    ELSE 1
  END,
  "includedUsers" = CASE
    WHEN tier::text IN ('OPS_SCAN_PO') THEN 100
    ELSE 10
  END;

-- Step 4: Add temporary column with new enum type
ALTER TABLE "licenses" ADD COLUMN "tier_new" "LicenseTier_new";

-- Step 5: Map old tiers to new tiers
UPDATE "licenses"
SET "tier_new" = CASE
  WHEN tier::text IN ('CORE', 'OPS') THEN 'BASE'::"LicenseTier_new"
  WHEN tier::text IN ('OPS_SCAN', 'OPS_SCAN_PO') THEN 'ELITE'::"LicenseTier_new"
  ELSE 'BASE'::"LicenseTier_new"
END;

-- Step 6: Drop old column and rename new one
ALTER TABLE "licenses" DROP COLUMN "tier";
ALTER TABLE "licenses" RENAME COLUMN "tier_new" TO "tier";
ALTER TABLE "licenses" ALTER COLUMN "tier" SET NOT NULL;
ALTER TABLE "licenses" ALTER COLUMN "tier" SET DEFAULT 'BASE'::"LicenseTier_new";

-- Step 7: Drop old enum type and rename new one
DROP TYPE "LicenseTier";
ALTER TYPE "LicenseTier_new" RENAME TO "LicenseTier";

-- Step 8: Add unique constraints for Stripe fields
CREATE UNIQUE INDEX IF NOT EXISTS "licenses_stripeCustomerId_key" ON "licenses"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "licenses_stripeSubscriptionId_key" ON "licenses"("stripeSubscriptionId");
