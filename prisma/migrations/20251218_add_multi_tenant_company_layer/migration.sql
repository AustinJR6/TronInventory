-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LicenseTier" AS ENUM ('CORE', 'OPS', 'OPS_SCAN', 'OPS_SCAN_PO');

-- CreateTable: companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "appName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: licenses
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'TRIAL',
    "tier" "LicenseTier" NOT NULL DEFAULT 'CORE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: inventory_transactions
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_companyId_key" ON "licenses"("companyId");

-- AddForeignKey: licenses -> companies
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: Add companyId column to all tenant tables (nullable first)
ALTER TABLE "branches" ADD COLUMN "companyId" TEXT;
ALTER TABLE "users" ADD COLUMN "companyId" TEXT;
ALTER TABLE "warehouse_inventory" ADD COLUMN "companyId" TEXT;
ALTER TABLE "vehicle_inventory_items" ADD COLUMN "companyId" TEXT;
ALTER TABLE "vehicle_stocks" ADD COLUMN "companyId" TEXT;
ALTER TABLE "orders" ADD COLUMN "companyId" TEXT;

-- Step 2: Create default "Tron Solar" company
-- Note: This will be populated by the data migration script

-- Step 3: After data migration, make companyId NOT NULL and add foreign keys
-- Note: These will be executed after data backfill in a separate migration
