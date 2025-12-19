import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting multi-tenant migration...\n');

  // Step 1: Create Tron Solar company
  console.log('📦 Creating Tron Solar company...');
  const tronSolar = await prisma.company.create({
    data: {
      name: 'Tron Solar',
      slug: 'tron-solar',
      appName: 'Tron Inventory',
      primaryColor: '#FF6B35', // Tron orange
      logoUrl: null,
    },
  });
  console.log(`✅ Created company: ${tronSolar.name} (${tronSolar.id})\n`);

  // Step 2: Create default license for Tron Solar
  console.log('📄 Creating default license...');
  const license = await prisma.license.create({
    data: {
      companyId: tronSolar.id,
      status: 'ACTIVE',
      tier: 'OPS', // Full ops features
      startsAt: new Date(),
      expiresAt: null, // No expiry
      notes: 'Default license for Tron Solar - full features enabled',
    },
  });
  console.log(`✅ Created license: ${license.tier} (status: ${license.status})\n`);

  // Step 3: Backfill companyId for all existing branches
  console.log('🏢 Backfilling branches...');
  const branchUpdate = await prisma.$executeRaw`
    UPDATE "branches"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${branchUpdate} branches\n`);

  // Step 4: Backfill companyId for all existing users
  console.log('👥 Backfilling users...');
  const userUpdate = await prisma.$executeRaw`
    UPDATE "users"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${userUpdate} users\n`);

  // Step 5: Backfill companyId for all warehouse inventory
  console.log('📦 Backfilling warehouse inventory...');
  const warehouseUpdate = await prisma.$executeRaw`
    UPDATE "warehouse_inventory"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${warehouseUpdate} warehouse inventory items\n`);

  // Step 6: Backfill companyId for all vehicle inventory items
  console.log('🚗 Backfilling vehicle inventory items...');
  const vehicleItemUpdate = await prisma.$executeRaw`
    UPDATE "vehicle_inventory_items"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${vehicleItemUpdate} vehicle inventory items\n`);

  // Step 7: Backfill companyId for all vehicle stocks
  console.log('📊 Backfilling vehicle stocks...');
  const vehicleStockUpdate = await prisma.$executeRaw`
    UPDATE "vehicle_stocks"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${vehicleStockUpdate} vehicle stocks\n`);

  // Step 8: Backfill companyId for all orders
  console.log('📋 Backfilling orders...');
  const orderUpdate = await prisma.$executeRaw`
    UPDATE "orders"
    SET "companyId" = ${tronSolar.id}
    WHERE "companyId" IS NULL
  `;
  console.log(`✅ Updated ${orderUpdate} orders\n`);

  // Step 9: Add NOT NULL constraints and foreign keys
  console.log('🔒 Adding constraints and foreign keys...');

  await prisma.$executeRaw`ALTER TABLE "branches" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  await prisma.$executeRaw`DROP INDEX IF EXISTS "branches_name_key"`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX "branches_companyId_name_key" ON "branches"("companyId", "name")`;

  await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;

  await prisma.$executeRaw`ALTER TABLE "warehouse_inventory" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  await prisma.$executeRaw`DROP INDEX IF EXISTS "warehouse_inventory_itemName_branchId_key"`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX "warehouse_inventory_companyId_itemName_branchId_key" ON "warehouse_inventory"("companyId", "itemName", "branchId")`;

  await prisma.$executeRaw`ALTER TABLE "vehicle_inventory_items" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "vehicle_inventory_items" ADD CONSTRAINT "vehicle_inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  await prisma.$executeRaw`DROP INDEX IF EXISTS "vehicle_inventory_items_itemName_key"`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX "vehicle_inventory_items_companyId_itemName_key" ON "vehicle_inventory_items"("companyId", "itemName")`;

  await prisma.$executeRaw`ALTER TABLE "vehicle_stocks" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "vehicle_stocks" ADD CONSTRAINT "vehicle_stocks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;

  await prisma.$executeRaw`ALTER TABLE "orders" ALTER COLUMN "companyId" SET NOT NULL`;
  await prisma.$executeRaw`ALTER TABLE "orders" ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  await prisma.$executeRaw`DROP INDEX IF EXISTS "orders_orderNumber_key"`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX "orders_companyId_orderNumber_key" ON "orders"("companyId", "orderNumber")`;

  await prisma.$executeRaw`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  await prisma.$executeRaw`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "warehouse_inventory"("id") ON UPDATE CASCADE`;

  console.log(`✅ All constraints and foreign keys added\n`);

  console.log('✨ Migration completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Company: ${tronSolar.name}`);
  console.log(`   Company ID: ${tronSolar.id}`);
  console.log(`   License Tier: ${license.tier}`);
  console.log(`   License Status: ${license.status}`);
  console.log(`   Branches updated: ${branchUpdate}`);
  console.log(`   Users updated: ${userUpdate}`);
  console.log(`   Warehouse items updated: ${warehouseUpdate}`);
  console.log(`   Vehicle items updated: ${vehicleItemUpdate}`);
  console.log(`   Vehicle stocks updated: ${vehicleStockUpdate}`);
  console.log(`   Orders updated: ${orderUpdate}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
