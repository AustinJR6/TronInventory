import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Get St. Louis branch
  const stLouisBranch = await prisma.branch.findUnique({
    where: { name: 'St. Louis' },
  });

  if (!stLouisBranch) {
    throw new Error('St. Louis branch not found. Please run seed-branches.ts first.');
  }

  // Create main admin user
  const hashedPassword = await bcrypt.hash('Solar2025!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'raustinj39@gmail.com' },
    update: {
      password: hashedPassword,
      active: true,
      branchId: stLouisBranch.id,
    },
    create: {
      email: 'raustinj39@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
      branchId: stLouisBranch.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Deactivate old admin if exists
  try {
    await prisma.user.update({
      where: { email: 'admin@tronsolar.com' },
      data: { active: false },
    });
  } catch (e) {
    // Old admin doesn't exist, that's fine
  }

  // Warehouse BOS Inventory Items
  const warehouseItems = [
    // 2" PVC / Rigid
    { itemName: '2" PVC conduit', category: '2" PVC / Rigid', parLevel: 20, currentQty: 20, unit: 'sticks' },
    { itemName: '2" PVC 90° elbows (bell)', category: '2" PVC / Rigid', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '2" PVC couplers', category: '2" PVC / Rigid', parLevel: 24, currentQty: 24, unit: 'pieces' },
    { itemName: '2" PVC male adapters', category: '2" PVC / Rigid', parLevel: 50, currentQty: 50, unit: 'pieces' },
    { itemName: '2" lock rings', category: '2" PVC / Rigid', parLevel: 50, currentQty: 50, unit: 'pieces' },
    { itemName: '2" plastic bushings', category: '2" PVC / Rigid', parLevel: 50, currentQty: 50, unit: 'pieces' },
    { itemName: '2" weather sealing rings', category: '2" PVC / Rigid', parLevel: 3, currentQty: 3, unit: 'boxes' },
    { itemName: '2" weather heads', category: '2" PVC / Rigid', parLevel: 5, currentQty: 5, unit: 'pieces' },
    { itemName: '12×12×6 PVC junction box', category: '2" PVC / Rigid', parLevel: 5, currentQty: 5, unit: 'pieces' },
    { itemName: '8×8×4 PVC junction box', category: '2" PVC / Rigid', parLevel: 5, currentQty: 5, unit: 'pieces' },
    { itemName: '6×6×4 PVC junction box', category: '2" PVC / Rigid', parLevel: 5, currentQty: 5, unit: 'pieces' },
    { itemName: '2" PVC straps', category: '2" PVC / Rigid', parLevel: 200, currentQty: 200, unit: 'pieces' },
    { itemName: '2" rigid conduit (10 ft)', category: '2" PVC / Rigid', parLevel: 6, currentQty: 6, unit: 'sticks' },

    // 3/4" EMT
    { itemName: '3/4" EMT conduit', category: '3/4" EMT', parLevel: 60, currentQty: 60, unit: 'sticks' },
    { itemName: '3/4" male connectors', category: '3/4" EMT', parLevel: 200, currentQty: 200, unit: 'pieces' },
    { itemName: '3/4" couplers', category: '3/4" EMT', parLevel: 200, currentQty: 200, unit: 'pieces' },
    { itemName: '3/4" ground bushings', category: '3/4" EMT', parLevel: 200, currentQty: 200, unit: 'pieces' },
    { itemName: '3/4" LB conduit bodies', category: '3/4" EMT', parLevel: 80, currentQty: 80, unit: 'pieces' },
    { itemName: '3/4" LL conduit bodies', category: '3/4" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '3/4" LR conduit bodies', category: '3/4" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '3/4" T conduit bodies', category: '3/4" EMT', parLevel: 20, currentQty: 20, unit: 'pieces' },
    { itemName: '3/4" closed nipples', category: '3/4" EMT', parLevel: 50, currentQty: 50, unit: 'pieces' },
    { itemName: '3/4" standard nipples', category: '3/4" EMT', parLevel: 20, currentQty: 20, unit: 'pieces' },

    // 1" EMT
    { itemName: '1" EMT conduit', category: '1" EMT', parLevel: 25, currentQty: 25, unit: 'sticks' },
    { itemName: '1" male adapters', category: '1" EMT', parLevel: 100, currentQty: 100, unit: 'pieces' },
    { itemName: '1" couplers', category: '1" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '1" ground bushings', category: '1" EMT', parLevel: 100, currentQty: 100, unit: 'pieces' },
    { itemName: '1" LB conduit bodies', category: '1" EMT', parLevel: 60, currentQty: 60, unit: 'pieces' },
    { itemName: '1" LL conduit bodies', category: '1" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '1" LR conduit bodies', category: '1" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },
    { itemName: '1" closed nipples', category: '1" EMT', parLevel: 40, currentQty: 40, unit: 'pieces' },

    // Wire - Warehouse
    { itemName: '3/0 copper conductor', category: 'Wire', parLevel: 1, currentQty: 1, unit: 'roll' },
    { itemName: 'Polaris lugs (3/0)', category: 'Wire', parLevel: 100, currentQty: 100, unit: 'pieces' },
    { itemName: '#10 THHN Red', category: 'Wire', parLevel: 3000, currentQty: 3000, unit: 'ft' },
    { itemName: '#10 THHN Black', category: 'Wire', parLevel: 3000, currentQty: 3000, unit: 'ft' },
    { itemName: '#10 THHN Green', category: 'Wire', parLevel: 3000, currentQty: 3000, unit: 'ft' },
    { itemName: '#6 THHN Red', category: 'Wire', parLevel: 1000, currentQty: 1000, unit: 'ft' },
    { itemName: '#6 THHN Black', category: 'Wire', parLevel: 1000, currentQty: 1000, unit: 'ft' },
    { itemName: '#6 THHN White', category: 'Wire', parLevel: 1000, currentQty: 1000, unit: 'ft' },
    { itemName: '#6 THHN Green', category: 'Wire', parLevel: 1000, currentQty: 1000, unit: 'ft' },
    { itemName: '#8 THHN Red', category: 'Wire', parLevel: 750, currentQty: 750, unit: 'ft' },
    { itemName: '#8 THHN Black', category: 'Wire', parLevel: 750, currentQty: 750, unit: 'ft' },
    { itemName: '#8 THHN White', category: 'Wire', parLevel: 750, currentQty: 750, unit: 'ft' },
    { itemName: '#8 THHN Green', category: 'Wire', parLevel: 750, currentQty: 750, unit: 'ft' },
    { itemName: 'Bare copper #4', category: 'Wire', parLevel: 500, currentQty: 500, unit: 'ft' },

    // Small Goods / Grounding
    { itemName: 'Wagos (comms)', category: 'Small Goods / Grounding', parLevel: 200, currentQty: 200, unit: 'pieces' },
    { itemName: 'Standard wire nuts', category: 'Small Goods / Grounding', parLevel: 875, currentQty: 875, unit: 'pieces' },
    { itemName: 'Grounding bars', category: 'Small Goods / Grounding', parLevel: 20, currentQty: 20, unit: 'pieces' },
    { itemName: 'Bonding bridges', category: 'Small Goods / Grounding', parLevel: 20, currentQty: 20, unit: 'pieces' },
    { itemName: 'Comms wire', category: 'Small Goods / Grounding', parLevel: 2000, currentQty: 2000, unit: 'ft' },
    { itemName: 'Ground rods', category: 'Small Goods / Grounding', parLevel: 10, currentQty: 10, unit: 'pieces' },
    { itemName: 'Acorns for ground rods', category: 'Small Goods / Grounding', parLevel: 10, currentQty: 10, unit: 'pieces' },
  ];

  console.log('Seeding warehouse inventory...');
  for (const item of warehouseItems) {
    await prisma.warehouseInventory.create({
      data: {
        ...item,
        branchId: stLouisBranch.id,
      },
    });
  }
  console.log(`Created ${warehouseItems.length} warehouse inventory items for St. Louis branch`);

  // Vehicle Inventory Items (Par Levels)
  const vehicleItems = [
    // 2" PVC / Rigid
    { itemName: '2" PVC conduit', category: '2" PVC / Rigid', parLevel: 5, unit: 'sticks' },
    { itemName: '2" PVC 90° elbows (bell)', category: '2" PVC / Rigid', parLevel: 10, unit: 'pieces' },
    { itemName: '2" PVC couplers', category: '2" PVC / Rigid', parLevel: 6, unit: 'pieces' },
    { itemName: '2" PVC male adapters', category: '2" PVC / Rigid', parLevel: 20, unit: 'pieces' },
    { itemName: '2" lock rings', category: '2" PVC / Rigid', parLevel: 20, unit: 'pieces' },
    { itemName: '2" plastic bushings', category: '2" PVC / Rigid', parLevel: 20, unit: 'pieces' },
    { itemName: '2" weather sealing rings', category: '2" PVC / Rigid', parLevel: 1, unit: 'box' },
    { itemName: '2" weather head', category: '2" PVC / Rigid', parLevel: 1, unit: 'piece' },
    { itemName: '12×12×6 PVC junction box', category: '2" PVC / Rigid', parLevel: 3, unit: 'pieces' },
    { itemName: '8×8×4 PVC junction box', category: '2" PVC / Rigid', parLevel: 3, unit: 'pieces' },
    { itemName: '6×6×4 PVC junction box', category: '2" PVC / Rigid', parLevel: 3, unit: 'pieces' },
    { itemName: '2" PVC straps', category: '2" PVC / Rigid', parLevel: 23, unit: 'pieces' },
    { itemName: '2" rigid conduit', category: '2" PVC / Rigid', parLevel: 1, unit: '10-ft stick' },

    // 3/4" EMT (Raintight)
    { itemName: '3/4" EMT conduit', category: '3/4" EMT', parLevel: 15, unit: 'sticks' },
    { itemName: '3/4" male connectors', category: '3/4" EMT', parLevel: 50, unit: 'pieces' },
    { itemName: '3/4" couplers', category: '3/4" EMT', parLevel: 50, unit: 'pieces' },
    { itemName: '3/4" ground bushings', category: '3/4" EMT', parLevel: 50, unit: 'pieces' },
    { itemName: '3/4" LB conduit bodies', category: '3/4" EMT', parLevel: 20, unit: 'pieces' },
    { itemName: '3/4" LL conduit bodies', category: '3/4" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '3/4" LR conduit bodies', category: '3/4" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '3/4" T conduit bodies', category: '3/4" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '3/4" closed nipples', category: '3/4" EMT', parLevel: 20, unit: 'pieces' },
    { itemName: '3/4" standard nipples (non-closed)', category: '3/4" EMT', parLevel: 20, unit: 'pieces' },

    // 1" EMT (Raintight)
    { itemName: '1" EMT conduit', category: '1" EMT', parLevel: 6, unit: 'sticks' },
    { itemName: '1" male adapters', category: '1" EMT', parLevel: 20, unit: 'pieces' },
    { itemName: '1" couplers', category: '1" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '1" ground bushings', category: '1" EMT', parLevel: 20, unit: 'pieces' },
    { itemName: '1" LB conduit bodies', category: '1" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '1" LL conduit bodies', category: '1" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '1" LR conduit bodies', category: '1" EMT', parLevel: 10, unit: 'pieces' },
    { itemName: '1" closed nipples', category: '1" EMT', parLevel: 10, unit: 'pieces' },

    // Wire & Terminations
    { itemName: '3/0 copper conductor', category: 'Wire & Terminations', parLevel: 150, unit: 'ft' },
    { itemName: 'Polaris lugs (3/0)', category: 'Wire & Terminations', parLevel: 30, unit: 'pieces' },
    { itemName: 'Wagos (comms)', category: 'Wire & Terminations', parLevel: 50, unit: 'pieces' },
    { itemName: 'Standard wire nuts', category: 'Wire & Terminations', parLevel: 100, unit: 'pieces' },
    { itemName: 'Grounding bars', category: 'Wire & Terminations', parLevel: 5, unit: 'pieces' },
    { itemName: 'Bonding bridges', category: 'Wire & Terminations', parLevel: 5, unit: 'pieces' },
    { itemName: 'Comms wire', category: 'Wire & Terminations', parLevel: 500, unit: 'ft' },

    // THHN - #10
    { itemName: '#10 THHN Red', category: 'THHN - #10', parLevel: 2000, unit: 'ft' },
    { itemName: '#10 THHN Black', category: 'THHN - #10', parLevel: 2000, unit: 'ft' },
    { itemName: '#10 THHN Green', category: 'THHN - #10', parLevel: 2000, unit: 'ft' },

    // THHN - #6
    { itemName: '#6 THHN Red', category: 'THHN - #6', parLevel: 500, unit: 'ft' },
    { itemName: '#6 THHN Black', category: 'THHN - #6', parLevel: 500, unit: 'ft' },
    { itemName: '#6 THHN White', category: 'THHN - #6', parLevel: 500, unit: 'ft' },
    { itemName: '#6 THHN Green', category: 'THHN - #6', parLevel: 500, unit: 'ft' },

    // THHN - #8
    { itemName: '#8 THHN Red', category: 'THHN - #8', parLevel: 500, unit: 'ft' },
    { itemName: '#8 THHN Black', category: 'THHN - #8', parLevel: 500, unit: 'ft' },
    { itemName: '#8 THHN White', category: 'THHN - #8', parLevel: 500, unit: 'ft' },
    { itemName: '#8 THHN Green', category: 'THHN - #8', parLevel: 500, unit: 'ft' },
  ];

  console.log('Seeding vehicle inventory items...');
  for (const item of vehicleItems) {
    await prisma.vehicleInventoryItem.create({ data: item });
  }
  console.log(`Created ${vehicleItems.length} vehicle inventory items`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
