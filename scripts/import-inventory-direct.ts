import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Warehouse BOS Inventory data
const warehouseInventory = [
  // 2" PVC / Rigid
  { itemName: '2" PVC conduit', quantity: 20, unit: 'sticks', category: '2" PVC / Rigid' },
  { itemName: '2" PVC 90° elbows (bell)', quantity: 40, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC couplers', quantity: 24, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC male adapters', quantity: 50, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" lock rings', quantity: 50, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" plastic bushings', quantity: 50, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" weather sealing rings', quantity: 3, unit: 'boxes', category: '2" PVC / Rigid' },
  { itemName: '2" weather heads', quantity: 5, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '12×12×6 PVC junction box', quantity: 5, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '8×8×4 PVC junction box', quantity: 5, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '6×6×4 PVC junction box', quantity: 5, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC straps', quantity: 200, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" rigid conduit (10 ft)', quantity: 6, unit: 'sticks', category: '2" PVC / Rigid' },

  // 3/4" EMT
  { itemName: '3/4" EMT conduit', quantity: 60, unit: 'sticks', category: '3/4" EMT' },
  { itemName: '3/4" male connectors', quantity: 200, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" couplers', quantity: 200, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" ground bushings', quantity: 200, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LB conduit bodies', quantity: 80, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LL conduit bodies', quantity: 40, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LR conduit bodies', quantity: 40, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" T conduit bodies', quantity: 20, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" closed nipples', quantity: 50, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" standard nipples', quantity: 20, unit: 'ea', category: '3/4" EMT' },

  // 1" EMT
  { itemName: '1" EMT conduit', quantity: 25, unit: 'sticks', category: '1" EMT' },
  { itemName: '1" male adapters', quantity: 100, unit: 'ea', category: '1" EMT' },
  { itemName: '1" couplers', quantity: 40, unit: 'ea', category: '1" EMT' },
  { itemName: '1" ground bushings', quantity: 100, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LB conduit bodies', quantity: 60, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LL conduit bodies', quantity: 40, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LR conduit bodies', quantity: 40, unit: 'ea', category: '1" EMT' },
  { itemName: '1" closed nipples', quantity: 40, unit: 'ea', category: '1" EMT' },

  // Wire - Warehouse
  { itemName: '3/0 copper conductor', quantity: 1, unit: 'roll', category: 'Wire' },
  { itemName: 'Polaris lugs (3/0)', quantity: 100, unit: 'ea', category: 'Wire' },
  { itemName: '#10 THHN Red', quantity: 3000, unit: 'ft', category: 'Wire' },
  { itemName: '#10 THHN Black', quantity: 3000, unit: 'ft', category: 'Wire' },
  { itemName: '#10 THHN Green', quantity: 3000, unit: 'ft', category: 'Wire' },
  { itemName: '#6 THHN Red', quantity: 1000, unit: 'ft', category: 'Wire' },
  { itemName: '#6 THHN Black', quantity: 1000, unit: 'ft', category: 'Wire' },
  { itemName: '#6 THHN White', quantity: 1000, unit: 'ft', category: 'Wire' },
  { itemName: '#6 THHN Green', quantity: 1000, unit: 'ft', category: 'Wire' },
  { itemName: '#8 THHN Red', quantity: 750, unit: 'ft', category: 'Wire' },
  { itemName: '#8 THHN Black', quantity: 750, unit: 'ft', category: 'Wire' },
  { itemName: '#8 THHN White', quantity: 750, unit: 'ft', category: 'Wire' },
  { itemName: '#8 THHN Green', quantity: 750, unit: 'ft', category: 'Wire' },
  { itemName: 'Bare copper #4', quantity: 500, unit: 'ft', category: 'Wire' },

  // Small Goods / Grounding
  { itemName: 'Wagos (comms)', quantity: 200, unit: 'ea', category: 'Small Goods / Grounding' },
  { itemName: 'Standard wire nuts', quantity: 875, unit: 'ea', category: 'Small Goods / Grounding' },
  { itemName: 'Grounding bars', quantity: 20, unit: 'ea', category: 'Small Goods / Grounding' },
  { itemName: 'Bonding bridges', quantity: 20, unit: 'ea', category: 'Small Goods / Grounding' },
  { itemName: 'Comms wire', quantity: 2000, unit: 'ft', category: 'Small Goods / Grounding' },
  { itemName: 'Ground rods', quantity: 10, unit: 'ea', category: 'Small Goods / Grounding' },
  { itemName: 'Acorns for ground rods', quantity: 10, unit: 'ea', category: 'Small Goods / Grounding' },
];

// Vehicle Inventory data
const vehicleInventory = [
  // 2" PVC / Rigid
  { itemName: '2" PVC conduit', quantity: 5, unit: 'sticks', category: '2" PVC / Rigid' },
  { itemName: '2" PVC 90° elbows (bell)', quantity: 10, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC couplers', quantity: 6, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC male adapters', quantity: 20, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" lock rings', quantity: 20, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" plastic bushings', quantity: 20, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" weather sealing rings', quantity: 1, unit: 'box', category: '2" PVC / Rigid' },
  { itemName: '2" weather head', quantity: 1, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '12×12×6 PVC junction box', quantity: 3, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '8×8×4 PVC junction box', quantity: 3, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '6×6×4 PVC junction box', quantity: 3, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" PVC straps', quantity: 22, unit: 'ea', category: '2" PVC / Rigid' },
  { itemName: '2" rigid conduit', quantity: 1, unit: 'stick', category: '2" PVC / Rigid' },

  // 3/4" EMT (Raintight)
  { itemName: '3/4" EMT conduit', quantity: 15, unit: 'sticks', category: '3/4" EMT' },
  { itemName: '3/4" male connectors', quantity: 50, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" couplers', quantity: 50, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" ground bushings', quantity: 50, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LB conduit bodies', quantity: 20, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LL conduit bodies', quantity: 10, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" LR conduit bodies', quantity: 10, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" T conduit bodies', quantity: 10, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" closed nipples', quantity: 20, unit: 'ea', category: '3/4" EMT' },
  { itemName: '3/4" standard nipples (non-closed)', quantity: 20, unit: 'ea', category: '3/4" EMT' },

  // 1" EMT (Raintight)
  { itemName: '1" EMT conduit', quantity: 6, unit: 'sticks', category: '1" EMT' },
  { itemName: '1" male adapters', quantity: 20, unit: 'ea', category: '1" EMT' },
  { itemName: '1" couplers', quantity: 10, unit: 'ea', category: '1" EMT' },
  { itemName: '1" ground bushings', quantity: 20, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LB conduit bodies', quantity: 10, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LL conduit bodies', quantity: 10, unit: 'ea', category: '1" EMT' },
  { itemName: '1" LR conduit bodies', quantity: 10, unit: 'ea', category: '1" EMT' },
  { itemName: '1" closed nipples', quantity: 10, unit: 'ea', category: '1" EMT' },

  // Wire & Terminations
  { itemName: '3/0 copper conductor', quantity: 150, unit: 'ft', category: 'Wire & Terminations' },
  { itemName: 'Polaris lugs (3/0)', quantity: 30, unit: 'ea', category: 'Wire & Terminations' },
  { itemName: 'Wagos (comms)', quantity: 50, unit: 'ea', category: 'Wire & Terminations' },
  { itemName: 'Standard wire nuts', quantity: 100, unit: 'ea', category: 'Wire & Terminations' },
  { itemName: 'Grounding bars', quantity: 5, unit: 'ea', category: 'Wire & Terminations' },
  { itemName: 'Bonding bridges', quantity: 5, unit: 'ea', category: 'Wire & Terminations' },
  { itemName: 'Comms wire', quantity: 500, unit: 'ft', category: 'Wire & Terminations' },

  // THHN - #10
  { itemName: 'THHN #10 Red', quantity: 2000, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #10 Black', quantity: 2000, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #10 Green', quantity: 2000, unit: 'ft', category: 'THHN Wire' },

  // THHN - #6
  { itemName: 'THHN #6 Red', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #6 Black', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #6 White', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #6 Green', quantity: 500, unit: 'ft', category: 'THHN Wire' },

  // THHN - #8
  { itemName: 'THHN #8 Red', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #8 Black', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #8 White', quantity: 500, unit: 'ft', category: 'THHN Wire' },
  { itemName: 'THHN #8 Green', quantity: 500, unit: 'ft', category: 'THHN Wire' },
];

async function importInventory() {
  try {
    // Get Tron Solar company
    const tronCompany = await prisma.company.findFirst({
      where: { slug: 'tron-solar' }
    });

    if (!tronCompany) {
      console.error('Tron Solar company not found');
      return;
    }

    console.log('Found Tron Solar company:', tronCompany.id);

    // Update license to top tier
    await prisma.license.upsert({
      where: { companyId: tronCompany.id },
      update: { tier: 'OPS_SCAN_PO', status: 'ACTIVE' },
      create: {
        companyId: tronCompany.id,
        tier: 'OPS_SCAN_PO',
        status: 'ACTIVE',
        expiresAt: new Date('2026-12-31')
      }
    });
    console.log('✅ Updated license to OPS_SCAN_PO');

    // Import warehouse inventory
    console.log('\nImporting warehouse inventory...');
    for (const item of warehouseInventory) {
      await prisma.warehouseInventory.create({
        data: {
          companyId: tronCompany.id,
          itemName: item.itemName,
          category: item.category,
          sku: `WH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          currentQty: item.quantity,
          parLevel: Math.floor(item.quantity * 0.2), // Set par level to 20% of current
          unit: item.unit,
        }
      });
      console.log(`  ✓ Added: ${item.itemName} (${item.quantity} ${item.unit})`);
    }
    console.log(`✅ Imported ${warehouseInventory.length} warehouse items`);

    // Import vehicle inventory
    console.log('\nImporting vehicle inventory items...');
    for (const item of vehicleInventory) {
      await prisma.vehicleInventoryItem.create({
        data: {
          companyId: tronCompany.id,
          itemName: item.itemName,
          category: item.category,
          parLevel: item.quantity, // Use the quantity as the par level (standard qty for van)
          unit: item.unit,
        }
      });
      console.log(`  ✓ Added: ${item.itemName} (${item.quantity} ${item.unit})`);
    }
    console.log(`✅ Imported ${vehicleInventory.length} vehicle inventory items`);

    console.log('\n🎉 Import complete!');
    console.log(`Total warehouse items: ${warehouseInventory.length}`);
    console.log(`Total vehicle items: ${vehicleInventory.length}`);

  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importInventory();
