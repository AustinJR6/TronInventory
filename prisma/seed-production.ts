/**
 * Production Seeding Script
 * Seeds two companies: Tron Solar and Generic Test Company
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...\n');

  // ==============================================
  // COMPANY 1: TRON SOLAR
  // ==============================================
  console.log('📦 Creating Tron Solar company...');
  const tronSolar = await prisma.company.upsert({
    where: { slug: 'tron-solar' },
    update: {},
    create: {
      name: 'Tron Solar',
      slug: 'tron-solar',
      appName: 'Tron Inventory',
      primaryColor: '#FF6B35',
      logoUrl: null,
    },
  });
  console.log(`✅ Tron Solar company created: ${tronSolar.id}\n`);

  // Create Tron Solar License
  console.log('📄 Creating Tron Solar license...');
  await prisma.license.upsert({
    where: { companyId: tronSolar.id },
    update: {},
    create: {
      companyId: tronSolar.id,
      status: 'ACTIVE',
      tier: 'OPS',
      startsAt: new Date(),
      expiresAt: null,
      notes: 'Active OPS license - full features enabled',
    },
  });
  console.log('✅ Tron Solar license created\n');

  // Create Tron Solar Branch
  console.log('🏢 Creating Tron Solar branch...');
  let tronBranch = await prisma.branch.findFirst({
    where: {
      companyId: tronSolar.id,
      name: 'St. Louis',
    },
  });

  if (!tronBranch) {
    tronBranch = await prisma.branch.create({
      data: {
        companyId: tronSolar.id,
        name: 'St. Louis',
        city: 'St. Louis',
        address: null,
        active: true,
      },
    });
  }
  console.log(`✅ Tron Solar branch: ${tronBranch.id}\n`);

  // Create Tron Solar Admin User
  console.log('👤 Creating Tron Solar admin user...');
  const tronAdminPassword = await bcrypt.hash('Solar2025!', 10);
  const tronAdmin = await prisma.user.upsert({
    where: { email: 'raustinj39@gmail.com' },
    update: {
      password: tronAdminPassword,
      companyId: tronSolar.id,
      branchId: tronBranch.id,
      role: 'ADMIN',
      active: true,
    },
    create: {
      companyId: tronSolar.id,
      email: 'raustinj39@gmail.com',
      name: 'Tron Admin',
      password: tronAdminPassword,
      role: 'ADMIN',
      active: true,
      branchId: tronBranch.id,
    },
  });
  console.log(`✅ Tron Admin user created: ${tronAdmin.email}\n`);

  // Tron Solar Warehouse Inventory (from BOS inventory)
  console.log('📦 Creating Tron Solar warehouse inventory...');
  const tronWarehouseItems = [
    // Battery Team Specific Items
    { itemName: 'Solar Panel - 400W', category: 'Solar Modules', parLevel: 50, currentQty: 45, unit: 'ea' },
    { itemName: 'Solar Panel - 550W', category: 'Solar Modules', parLevel: 30, currentQty: 28, unit: 'ea' },
    { itemName: 'Inverter - 10kW', category: 'Inverters', parLevel: 10, currentQty: 8, unit: 'ea' },
    { itemName: 'Inverter - 7.6kW', category: 'Inverters', parLevel: 15, currentQty: 12, unit: 'ea' },
    { itemName: 'Battery Module - 13.5kWh', category: 'Battery Storage', parLevel: 20, currentQty: 18, unit: 'ea' },
    { itemName: 'Battery Backup Gateway', category: 'Battery Storage', parLevel: 20, currentQty: 15, unit: 'ea' },
    { itemName: 'Load Center - 200A', category: 'Electrical', parLevel: 15, currentQty: 12, unit: 'ea' },
    { itemName: 'Circuit Breaker - 60A', category: 'Electrical', parLevel: 40, currentQty: 35, unit: 'ea' },
    { itemName: 'Circuit Breaker - 30A', category: 'Electrical', parLevel: 50, currentQty: 48, unit: 'ea' },
    { itemName: 'AC Disconnect - 60A', category: 'Electrical', parLevel: 25, currentQty: 22, unit: 'ea' },
    { itemName: 'DC Disconnect - 600V', category: 'Electrical', parLevel: 25, currentQty: 20, unit: 'ea' },

    // Conduit & Fittings
    { itemName: 'EMT 3/4" - 10ft', category: 'Conduit', parLevel: 100, currentQty: 85, unit: 'ea' },
    { itemName: 'EMT 1" - 10ft', category: 'Conduit', parLevel: 80, currentQty: 72, unit: 'ea' },
    { itemName: 'PVC 2" - 10ft', category: 'Conduit', parLevel: 60, currentQty: 55, unit: 'ea' },
    { itemName: 'EMT Coupling 3/4"', category: 'Fittings', parLevel: 200, currentQty: 175, unit: 'ea' },
    { itemName: 'EMT Coupling 1"', category: 'Fittings', parLevel: 150, currentQty: 140, unit: 'ea' },
    { itemName: 'EMT Connector 3/4"', category: 'Fittings', parLevel: 200, currentQty: 180, unit: 'ea' },
    { itemName: 'EMT Connector 1"', category: 'Fittings', parLevel: 150, currentQty: 135, unit: 'ea' },
    { itemName: 'PVC Coupling 2"', category: 'Fittings', parLevel: 100, currentQty: 90, unit: 'ea' },
    { itemName: 'PVC 90° Elbow 2"', category: 'Fittings', parLevel: 80, currentQty: 75, unit: 'ea' },

    // Wire & Cable
    { itemName: 'Wire 10 AWG THHN Black', category: 'Wire', parLevel: 5000, currentQty: 4200, unit: 'ft' },
    { itemName: 'Wire 10 AWG THHN White', category: 'Wire', parLevel: 5000, currentQty: 4100, unit: 'ft' },
    { itemName: 'Wire 10 AWG THHN Red', category: 'Wire', parLevel: 3000, currentQty: 2800, unit: 'ft' },
    { itemName: 'Wire 10 AWG Bare Copper', category: 'Wire', parLevel: 5000, currentQty: 4500, unit: 'ft' },
    { itemName: 'Wire 8 AWG THHN Black', category: 'Wire', parLevel: 3000, currentQty: 2500, unit: 'ft' },
    { itemName: 'Wire 8 AWG THHN White', category: 'Wire', parLevel: 3000, currentQty: 2400, unit: 'ft' },
    { itemName: 'Wire 6 AWG THHN Black', category: 'Wire', parLevel: 2000, currentQty: 1800, unit: 'ft' },
    { itemName: 'MC Cable 10/3', category: 'Wire', parLevel: 1000, currentQty: 850, unit: 'ft' },
    { itemName: 'Solar PV Wire 10 AWG', category: 'Wire', parLevel: 3000, currentQty: 2700, unit: 'ft' },

    // Mounting Hardware
    { itemName: 'Rail - 168"', category: 'Mounting', parLevel: 100, currentQty: 88, unit: 'ea' },
    { itemName: 'Mid Clamp', category: 'Mounting', parLevel: 500, currentQty: 450, unit: 'ea' },
    { itemName: 'End Clamp', category: 'Mounting', parLevel: 300, currentQty: 275, unit: 'ea' },
    { itemName: 'L-Foot', category: 'Mounting', parLevel: 200, currentQty: 180, unit: 'ea' },
    { itemName: 'Flashing', category: 'Mounting', parLevel: 200, currentQty: 175, unit: 'ea' },
    { itemName: 'Lag Bolt 5/16" x 3"', category: 'Mounting', parLevel: 1000, currentQty: 900, unit: 'ea' },
    { itemName: 'Stainless Steel Bolt 3/8" x 3/4"', category: 'Mounting', parLevel: 800, currentQty: 720, unit: 'ea' },

    // Grounding
    { itemName: 'Grounding Lug - Copper', category: 'Grounding', parLevel: 100, currentQty: 85, unit: 'ea' },
    { itemName: 'Grounding Rod - 8ft', category: 'Grounding', parLevel: 50, currentQty: 42, unit: 'ea' },
    { itemName: 'Grounding Clamp', category: 'Grounding', parLevel: 100, currentQty: 90, unit: 'ea' },
    { itemName: 'WEEB Grounding Clip', category: 'Grounding', parLevel: 500, currentQty: 450, unit: 'ea' },

    // Misc Hardware
    { itemName: 'Junction Box - 6x6x4', category: 'Boxes', parLevel: 50, currentQty: 45, unit: 'ea' },
    { itemName: 'Junction Box - 8x8x4', category: 'Boxes', parLevel: 40, currentQty: 35, unit: 'ea' },
    { itemName: 'Weatherproof Box Cover', category: 'Boxes', parLevel: 60, currentQty: 52, unit: 'ea' },
    { itemName: 'Wire Nuts - Large', category: 'Small Goods', parLevel: 500, currentQty: 450, unit: 'ea' },
    { itemName: 'Wire Nuts - Medium', category: 'Small Goods', parLevel: 500, currentQty: 470, unit: 'ea' },
    { itemName: 'Romex Staples', category: 'Small Goods', parLevel: 1000, currentQty: 850, unit: 'ea' },
    { itemName: 'Zip Ties - 8"', category: 'Small Goods', parLevel: 1000, currentQty: 920, unit: 'ea' },
    { itemName: 'Electrical Tape', category: 'Small Goods', parLevel: 100, currentQty: 88, unit: 'ea' },
    { itemName: 'Silicone Sealant', category: 'Small Goods', parLevel: 50, currentQty: 42, unit: 'ea' },
  ];

  for (const item of tronWarehouseItems) {
    await prisma.warehouseInventory.upsert({
      where: {
        companyId_itemName_branchId: {
          companyId: tronSolar.id,
          itemName: item.itemName,
          branchId: tronBranch.id,
        },
      },
      update: {
        currentQty: item.currentQty,
      },
      create: {
        companyId: tronSolar.id,
        branchId: tronBranch.id,
        itemName: item.itemName,
        category: item.category,
        parLevel: item.parLevel,
        currentQty: item.currentQty,
        unit: item.unit,
      },
    });
  }
  console.log(`✅ Created ${tronWarehouseItems.length} Tron warehouse items\n`);

  // Tron Solar Vehicle Inventory Items (Battery Team Loadout)
  console.log('🚗 Creating Tron Solar vehicle inventory items...');
  const tronVehicleItems = [
    // Core Battery Installation Items
    { itemName: 'Battery Module - 13.5kWh', category: 'Battery Storage', parLevel: 2, unit: 'ea' },
    { itemName: 'Battery Backup Gateway', category: 'Battery Storage', parLevel: 1, unit: 'ea' },
    { itemName: 'Load Center - 200A', category: 'Electrical', parLevel: 1, unit: 'ea' },
    { itemName: 'Circuit Breaker - 60A', category: 'Electrical', parLevel: 2, unit: 'ea' },
    { itemName: 'Circuit Breaker - 30A', category: 'Electrical', parLevel: 3, unit: 'ea' },
    { itemName: 'AC Disconnect - 60A', category: 'Electrical', parLevel: 1, unit: 'ea' },

    // Conduit
    { itemName: 'EMT 3/4" - 10ft', category: 'Conduit', parLevel: 10, unit: 'ea' },
    { itemName: 'EMT 1" - 10ft', category: 'Conduit', parLevel: 8, unit: 'ea' },
    { itemName: 'PVC 2" - 10ft', category: 'Conduit', parLevel: 5, unit: 'ea' },

    // Fittings
    { itemName: 'EMT Coupling 3/4"', category: 'Fittings', parLevel: 20, unit: 'ea' },
    { itemName: 'EMT Coupling 1"', category: 'Fittings', parLevel: 15, unit: 'ea' },
    { itemName: 'EMT Connector 3/4"', category: 'Fittings', parLevel: 20, unit: 'ea' },
    { itemName: 'EMT Connector 1"', category: 'Fittings', parLevel: 15, unit: 'ea' },
    { itemName: 'PVC Coupling 2"', category: 'Fittings', parLevel: 10, unit: 'ea' },
    { itemName: 'PVC 90° Elbow 2"', category: 'Fittings', parLevel: 8, unit: 'ea' },

    // Wire
    { itemName: 'Wire 10 AWG THHN Black', category: 'Wire', parLevel: 250, unit: 'ft' },
    { itemName: 'Wire 10 AWG THHN White', category: 'Wire', parLevel: 250, unit: 'ft' },
    { itemName: 'Wire 10 AWG Bare Copper', category: 'Wire', parLevel: 250, unit: 'ft' },
    { itemName: 'Wire 8 AWG THHN Black', category: 'Wire', parLevel: 150, unit: 'ft' },
    { itemName: 'Wire 6 AWG THHN Black', category: 'Wire', parLevel: 100, unit: 'ft' },

    // Grounding
    { itemName: 'Grounding Lug - Copper', category: 'Grounding', parLevel: 5, unit: 'ea' },
    { itemName: 'Grounding Rod - 8ft', category: 'Grounding', parLevel: 2, unit: 'ea' },
    { itemName: 'Grounding Clamp', category: 'Grounding', parLevel: 5, unit: 'ea' },

    // Small Goods
    { itemName: 'Junction Box - 6x6x4', category: 'Boxes', parLevel: 3, unit: 'ea' },
    { itemName: 'Wire Nuts - Large', category: 'Small Goods', parLevel: 50, unit: 'ea' },
    { itemName: 'Wire Nuts - Medium', category: 'Small Goods', parLevel: 50, unit: 'ea' },
    { itemName: 'Zip Ties - 8"', category: 'Small Goods', parLevel: 100, unit: 'ea' },
    { itemName: 'Electrical Tape', category: 'Small Goods', parLevel: 5, unit: 'ea' },
    { itemName: 'Silicone Sealant', category: 'Small Goods', parLevel: 2, unit: 'ea' },
  ];

  for (const item of tronVehicleItems) {
    await prisma.vehicleInventoryItem.upsert({
      where: {
        companyId_itemName: {
          companyId: tronSolar.id,
          itemName: item.itemName,
        },
      },
      update: {},
      create: {
        companyId: tronSolar.id,
        itemName: item.itemName,
        category: item.category,
        parLevel: item.parLevel,
        unit: item.unit,
      },
    });
  }
  console.log(`✅ Created ${tronVehicleItems.length} Tron vehicle items\n`);

  // ==============================================
  // COMPANY 2: GENERIC TEST COMPANY
  // ==============================================
  console.log('📦 Creating Generic Test Company...');
  const testCompany = await prisma.company.upsert({
    where: { slug: 'test-company' },
    update: {},
    create: {
      name: 'Test Company',
      slug: 'test-company',
      appName: 'Test Inventory',
      primaryColor: '#3B82F6',
      logoUrl: null,
    },
  });
  console.log(`✅ Test Company created: ${testCompany.id}\n`);

  // Create Test Company License
  console.log('📄 Creating Test Company license...');
  await prisma.license.upsert({
    where: { companyId: testCompany.id },
    update: {},
    create: {
      companyId: testCompany.id,
      status: 'TRIAL',
      tier: 'CORE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: 'Trial CORE license - 30 day trial period',
    },
  });
  console.log('✅ Test Company license created\n');

  // Create Test Company Branch
  console.log('🏢 Creating Test Company branch...');
  let testBranch = await prisma.branch.findFirst({
    where: {
      companyId: testCompany.id,
      name: 'Main Warehouse',
    },
  });

  if (!testBranch) {
    testBranch = await prisma.branch.create({
      data: {
        companyId: testCompany.id,
        name: 'Main Warehouse',
        city: 'Seattle',
        address: null,
        active: true,
      },
    });
  }
  console.log(`✅ Test Company branch: ${testBranch.id}\n`);

  // Create Test Company Admin User
  console.log('👤 Creating Test Company admin user...');
  const testAdminPassword = await bcrypt.hash('Solar2025!', 10);
  const testAdmin = await prisma.user.upsert({
    where: { email: 'tennant2@outlook.com' },
    update: {
      password: testAdminPassword,
      companyId: testCompany.id,
      branchId: testBranch.id,
      role: 'ADMIN',
      active: true,
    },
    create: {
      companyId: testCompany.id,
      email: 'tennant2@outlook.com',
      name: 'Test Admin',
      password: testAdminPassword,
      role: 'ADMIN',
      active: true,
      branchId: testBranch.id,
    },
  });
  console.log(`✅ Test Admin user created: ${testAdmin.email}\n`);

  // Test Company Warehouse Inventory (Generic Items)
  console.log('📦 Creating Test Company warehouse inventory...');
  const testWarehouseItems = [
    // Tools
    { itemName: 'Hammer', category: 'Tools', parLevel: 10, currentQty: 8, unit: 'ea' },
    { itemName: 'Screwdriver Set', category: 'Tools', parLevel: 15, currentQty: 12, unit: 'ea' },
    { itemName: 'Drill', category: 'Tools', parLevel: 8, currentQty: 7, unit: 'ea' },
    { itemName: 'Tape Measure', category: 'Tools', parLevel: 20, currentQty: 18, unit: 'ea' },
    { itemName: 'Level', category: 'Tools', parLevel: 12, currentQty: 10, unit: 'ea' },

    // Hardware
    { itemName: 'Nails - 3"', category: 'Hardware', parLevel: 500, currentQty: 450, unit: 'ea' },
    { itemName: 'Screws - 2"', category: 'Hardware', parLevel: 1000, currentQty: 900, unit: 'ea' },
    { itemName: 'Bolts - 1/2"', category: 'Hardware', parLevel: 300, currentQty: 250, unit: 'ea' },
    { itemName: 'Nuts - 1/2"', category: 'Hardware', parLevel: 300, currentQty: 260, unit: 'ea' },
    { itemName: 'Washers', category: 'Hardware', parLevel: 500, currentQty: 480, unit: 'ea' },

    // Materials
    { itemName: 'Lumber 2x4 - 8ft', category: 'Materials', parLevel: 100, currentQty: 85, unit: 'ea' },
    { itemName: 'Plywood 4x8 - 1/2"', category: 'Materials', parLevel: 50, currentQty: 42, unit: 'ea' },
    { itemName: 'Drywall 4x8', category: 'Materials', parLevel: 75, currentQty: 65, unit: 'ea' },
    { itemName: 'Insulation Roll', category: 'Materials', parLevel: 30, currentQty: 25, unit: 'ea' },

    // Electrical
    { itemName: 'Wire 14/2 Romex', category: 'Electrical', parLevel: 1000, currentQty: 850, unit: 'ft' },
    { itemName: 'Outlet', category: 'Electrical', parLevel: 100, currentQty: 88, unit: 'ea' },
    { itemName: 'Light Switch', category: 'Electrical', parLevel: 80, currentQty: 72, unit: 'ea' },
    { itemName: 'Junction Box', category: 'Electrical', parLevel: 60, currentQty: 55, unit: 'ea' },

    // Paint
    { itemName: 'Paint - White Gallon', category: 'Paint', parLevel: 40, currentQty: 35, unit: 'gal' },
    { itemName: 'Paint - Primer Gallon', category: 'Paint', parLevel: 30, currentQty: 28, unit: 'gal' },
    { itemName: 'Paint Brushes', category: 'Paint', parLevel: 50, currentQty: 45, unit: 'ea' },
    { itemName: 'Paint Rollers', category: 'Paint', parLevel: 40, currentQty: 38, unit: 'ea' },
  ];

  for (const item of testWarehouseItems) {
    await prisma.warehouseInventory.upsert({
      where: {
        companyId_itemName_branchId: {
          companyId: testCompany.id,
          itemName: item.itemName,
          branchId: testBranch.id,
        },
      },
      update: {
        currentQty: item.currentQty,
      },
      create: {
        companyId: testCompany.id,
        branchId: testBranch.id,
        itemName: item.itemName,
        category: item.category,
        parLevel: item.parLevel,
        currentQty: item.currentQty,
        unit: item.unit,
      },
    });
  }
  console.log(`✅ Created ${testWarehouseItems.length} Test Company warehouse items\n`);

  // Test Company Vehicle Inventory Items
  console.log('🚗 Creating Test Company vehicle inventory items...');
  const testVehicleItems = [
    { itemName: 'Hammer', category: 'Tools', parLevel: 2, unit: 'ea' },
    { itemName: 'Screwdriver Set', category: 'Tools', parLevel: 1, unit: 'ea' },
    { itemName: 'Drill', category: 'Tools', parLevel: 1, unit: 'ea' },
    { itemName: 'Tape Measure', category: 'Tools', parLevel: 2, unit: 'ea' },
    { itemName: 'Nails - 3"', category: 'Hardware', parLevel: 50, unit: 'ea' },
    { itemName: 'Screws - 2"', category: 'Hardware', parLevel: 100, unit: 'ea' },
    { itemName: 'Wire 14/2 Romex', category: 'Electrical', parLevel: 100, unit: 'ft' },
    { itemName: 'Outlet', category: 'Electrical', parLevel: 10, unit: 'ea' },
    { itemName: 'Light Switch', category: 'Electrical', parLevel: 8, unit: 'ea' },
    { itemName: 'Paint Brushes', category: 'Paint', parLevel: 5, unit: 'ea' },
  ];

  for (const item of testVehicleItems) {
    await prisma.vehicleInventoryItem.upsert({
      where: {
        companyId_itemName: {
          companyId: testCompany.id,
          itemName: item.itemName,
        },
      },
      update: {},
      create: {
        companyId: testCompany.id,
        itemName: item.itemName,
        category: item.category,
        parLevel: item.parLevel,
        unit: item.unit,
      },
    });
  }
  console.log(`✅ Created ${testVehicleItems.length} Test Company vehicle items\n`);

  console.log('✨ Production seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   TRON SOLAR:');
  console.log(`   - Company ID: ${tronSolar.id}`);
  console.log(`   - Admin Email: raustinj39@gmail.com`);
  console.log('   - Password: Solar2025!');
  console.log('   - License: ACTIVE (OPS tier)');
  console.log(`   - Warehouse Items: ${tronWarehouseItems.length}`);
  console.log(`   - Vehicle Items: ${tronVehicleItems.length}`);
  console.log('');
  console.log('   TEST COMPANY:');
  console.log(`   - Company ID: ${testCompany.id}`);
  console.log(`   - Admin Email: tennant2@outlook.com`);
  console.log('   - Password: Solar2025!');
  console.log('   - License: TRIAL (CORE tier, 30 days)');
  console.log(`   - Warehouse Items: ${testWarehouseItems.length}`);
  console.log(`   - Vehicle Items: ${testVehicleItems.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
