import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugTenantSeparation() {
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      companyId: true,
      company: { select: { name: true, slug: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('=== ALL USERS IN DATABASE ===');
  allUsers.forEach(u => {
    console.log(`${u.email} -> Company: ${u.company?.name || 'NULL'} (ID: ${u.companyId || 'NULL'})`);
  });

  console.log(`\n=== TOTAL: ${allUsers.length} users ===\n`);

  // Check branches
  const allBranches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      companyId: true,
      company: { select: { name: true } }
    }
  });

  console.log('=== ALL BRANCHES ===');
  allBranches.forEach(b => {
    console.log(`${b.name} -> Company: ${b.company.name} (ID: ${b.companyId})`);
  });

  console.log(`\n=== TOTAL: ${allBranches.length} branches ===\n`);

  // Check warehouse inventory
  const inventoryCount = await prisma.warehouseInventory.groupBy({
    by: ['companyId'],
    _count: true
  });

  console.log('=== WAREHOUSE INVENTORY BY COMPANY ===');
  for (const item of inventoryCount) {
    const company = await prisma.company.findUnique({
      where: { id: item.companyId },
      select: { name: true }
    });
    console.log(`${company?.name}: ${item._count} items`);
  }

  await prisma.$disconnect();
}

debugTenantSeparation().catch(console.error);
