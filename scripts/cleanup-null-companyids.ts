/**
 * Cleanup script for null companyId values
 *
 * This script finds all records with null companyId and either:
 * 1. Assigns them to Tron Solar (for migration)
 * 2. Deletes them (for test data)
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🔍 Checking for records with null companyId...\n');

  // Get Tron Solar company ID
  const tronSolar = await prisma.company.findUnique({
    where: { slug: 'tron-solar' },
  });

  if (!tronSolar) {
    console.error('❌ Tron Solar company not found!');
    process.exit(1);
  }

  console.log(`✅ Tron Solar company found: ${tronSolar.id}\n`);

  // Use raw SQL to check for null companyIds (since Prisma client expects non-null)
  const usersWithNullCompany = await prisma.$queryRaw<Array<{ id: string; email: string; name: string }>>`
    SELECT id, email, name FROM users WHERE "companyId" IS NULL
  `;

  const branchesWithNullCompany = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
    SELECT id, name FROM branches WHERE "companyId" IS NULL
  `;

  const warehouseWithNullCompany = await prisma.$queryRaw<Array<{ id: string; itemName: string }>>`
    SELECT id, "itemName" FROM warehouse_inventory WHERE "companyId" IS NULL
  `;

  const vehicleItemsWithNullCompany = await prisma.$queryRaw<Array<{ id: string; itemName: string }>>`
    SELECT id, "itemName" FROM vehicle_inventory_items WHERE "companyId" IS NULL
  `;

  const ordersWithNullCompany = await prisma.$queryRaw<Array<{ id: string; orderNumber: string }>>`
    SELECT id, "orderNumber" FROM orders WHERE "companyId" IS NULL
  `;

  console.log('📊 Found records with null companyId:');
  console.log(`   Users: ${usersWithNullCompany.length}`);
  console.log(`   Branches: ${branchesWithNullCompany.length}`);
  console.log(`   Warehouse Inventory: ${warehouseWithNullCompany.length}`);
  console.log(`   Vehicle Items: ${vehicleItemsWithNullCompany.length}`);
  console.log(`   Orders: ${ordersWithNullCompany.length}`);
  console.log();

  if (usersWithNullCompany.length > 0) {
    console.log('👥 Users with null companyId:');
    usersWithNullCompany.forEach(u => {
      console.log(`   - ${u.email} (${u.name})`);
    });
    console.log();
  }

  // DELETE old test data instead of migrating
  console.log('🗑️  Deleting old test data...\n');

  if (ordersWithNullCompany.length > 0) {
    await prisma.$executeRaw`DELETE FROM orders WHERE "companyId" IS NULL`;
    console.log(`✅ Deleted ${ordersWithNullCompany.length} orders`);
  }

  if (warehouseWithNullCompany.length > 0) {
    await prisma.$executeRaw`DELETE FROM warehouse_inventory WHERE "companyId" IS NULL`;
    console.log(`✅ Deleted ${warehouseWithNullCompany.length} warehouse items`);
  }

  if (vehicleItemsWithNullCompany.length > 0) {
    await prisma.$executeRaw`DELETE FROM vehicle_inventory_items WHERE "companyId" IS NULL`;
    console.log(`✅ Deleted ${vehicleItemsWithNullCompany.length} vehicle items`);
  }

  if (usersWithNullCompany.length > 0) {
    await prisma.$executeRaw`DELETE FROM users WHERE "companyId" IS NULL`;
    console.log(`✅ Deleted ${usersWithNullCompany.length} users`);
  }

  if (branchesWithNullCompany.length > 0) {
    await prisma.$executeRaw`DELETE FROM branches WHERE "companyId" IS NULL`;
    console.log(`✅ Deleted ${branchesWithNullCompany.length} branches`);
  }

  console.log('\n✨ Cleanup complete!');

  await prisma.$disconnect();
}

cleanup().catch((error) => {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
});
