-- Add SKU and QR code fields to warehouse_inventory
ALTER TABLE "warehouse_inventory"
ADD COLUMN "sku" TEXT,
ADD COLUMN "qrCodeData" TEXT;

-- Add unique constraint for SKU within company and branch
-- Note: This constraint allows NULL values (multiple NULLs are allowed)
CREATE UNIQUE INDEX "warehouse_inventory_companyId_sku_branchId_key"
ON "warehouse_inventory"("companyId", "sku", "branchId")
WHERE "sku" IS NOT NULL;
