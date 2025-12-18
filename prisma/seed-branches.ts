import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting branch seeding...');

  // Create three branches
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { name: 'St. Louis' },
      update: {},
      create: {
        name: 'St. Louis',
        city: 'St. Louis',
        address: null,
        active: true,
      },
    }),
    prisma.branch.upsert({
      where: { name: 'Decatur' },
      update: {},
      create: {
        name: 'Decatur',
        city: 'Decatur',
        address: null,
        active: true,
      },
    }),
    prisma.branch.upsert({
      where: { name: 'Chicago' },
      update: {},
      create: {
        name: 'Chicago',
        city: 'Chicago',
        address: null,
        active: true,
      },
    }),
  ]);

  const stLouisBranch = branches[0];
  console.log('Created branches:', branches.map((b) => b.name).join(', '));

  // Assign all existing users to St. Louis branch
  const usersUpdated = await prisma.user.updateMany({
    where: { branchId: null },
    data: { branchId: stLouisBranch.id },
  });
  console.log(`Assigned ${usersUpdated.count} users to St. Louis branch`);

  // Assign all existing warehouse inventory to St. Louis branch
  const warehouseUpdated = await prisma.warehouseInventory.updateMany({
    where: { branchId: null },
    data: { branchId: stLouisBranch.id },
  });
  console.log(`Assigned ${warehouseUpdated.count} warehouse items to St. Louis branch`);

  // Assign all existing vehicle stocks to St. Louis branch
  const vehicleStocksUpdated = await prisma.vehicleStock.updateMany({
    where: { branchId: null },
    data: { branchId: stLouisBranch.id },
  });
  console.log(`Assigned ${vehicleStocksUpdated.count} vehicle stocks to St. Louis branch`);

  // Assign all existing orders to St. Louis branch
  const ordersUpdated = await prisma.order.updateMany({
    where: { branchId: null },
    data: { branchId: stLouisBranch.id },
  });
  console.log(`Assigned ${ordersUpdated.count} orders to St. Louis branch`);

  console.log('Branch seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
