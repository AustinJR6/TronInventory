import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testScoping() {
  console.log('🔍 Testing company scoping...\n');

  // Get both companies
  const tronSolar = await prisma.company.findUnique({
    where: { slug: 'tron-solar' },
  });

  const testCompany = await prisma.company.findUnique({
    where: { slug: 'test-company' },
  });

  if (!tronSolar || !testCompany) {
    console.error('❌ Companies not found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`Tron Solar ID: ${tronSolar.id}`);
  console.log(`Test Company ID: ${testCompany.id}\n`);

  // Test WITHOUT scoping (should see all data)
  const allUsers = await prisma.user.findMany({
    select: { email: true, companyId: true },
  });

  console.log('=== WITHOUT SCOPING (all users) ===');
  allUsers.forEach(u => {
    const companyName = u.companyId === tronSolar.id ? 'Tron Solar' : 'Test Company';
    console.log(`  ${u.email} -> ${companyName}`);
  });

  // Test WITH scoping for Test Company
  console.log('\n=== WITH SCOPING (Test Company) ===');
  const { withCompanyScope } = require('../lib/prisma-middleware');
  const scopedPrisma = withCompanyScope(testCompany.id);

  const scopedUsers = await scopedPrisma.user.findMany({
    select: { email: true, companyId: true },
  });

  console.log(`Expected: 1 user (tennant2@outlook.com)`);
  console.log(`Actual: ${scopedUsers.length} users`);
  scopedUsers.forEach(u => {
    console.log(`  - ${u.email} (companyId: ${u.companyId})`);
  });

  // Test warehouse inventory scoping
  console.log('\n=== WAREHOUSE INVENTORY SCOPING ===');
  const scopedInventory = await scopedPrisma.warehouseInventory.findMany({
    select: { itemName: true, companyId: true },
  });

  console.log(`Expected: 22 items (Test Company)`);
  console.log(`Actual: ${scopedInventory.length} items`);

  // Count by company
  const tronItems = scopedInventory.filter(i => i.companyId === tronSolar.id).length;
  const testItems = scopedInventory.filter(i => i.companyId === testCompany.id).length;
  console.log(`  - Tron Solar items: ${tronItems}`);
  console.log(`  - Test Company items: ${testItems}`);

  await prisma.$disconnect();
}

testScoping().catch(console.error);
