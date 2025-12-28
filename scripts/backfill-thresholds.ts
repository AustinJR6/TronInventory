/**
 * Backfill script for inventory thresholds
 *
 * This script creates InventoryThreshold records for existing WarehouseInventory items.
 * For each item, it sets:
 * - minLevel = 50% of parLevel
 * - criticalLevel = 25% of parLevel
 * - reorderQty = parLevel (suggested reorder brings back to par)
 *
 * Run with: npx tsx scripts/backfill-thresholds.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillThresholds() {
  console.log('Starting threshold backfill...\n');

  try {
    // Get all warehouse inventory items with their company and branch info
    const items = await prisma.warehouseInventory.findMany({
      include: {
        company: true,
      },
    });

    console.log(`Found ${items.length} warehouse inventory items\n`);

    // Get all branches grouped by company
    const companies = await prisma.company.findMany({
      include: {
        branches: true,
      },
    });

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      // Find the company for this item
      const company = companies.find((c) => c.id === item.companyId);
      if (!company) {
        console.log(`⚠ Warning: No company found for item ${item.itemName} (${item.id})`);
        errorCount++;
        continue;
      }

      // Calculate threshold values based on parLevel
      const minLevel = Math.floor(item.parLevel * 0.5);
      const criticalLevel = Math.floor(item.parLevel * 0.25);
      const reorderQty = item.parLevel;

      // Update the WarehouseInventory item with the new fields
      await prisma.warehouseInventory.update({
        where: { id: item.id },
        data: {
          minLevel,
          criticalLevel,
          reorderQty,
        },
      });

      // Create InventoryThreshold records for each branch in the company
      for (const branch of company.branches) {
        try {
          // Check if threshold already exists
          const existing = await prisma.inventoryThreshold.findUnique({
            where: {
              companyId_warehouseItemId_branchId: {
                companyId: item.companyId,
                warehouseItemId: item.id,
                branchId: branch.id,
              },
            },
          });

          if (existing) {
            console.log(`  ⏭ Skipped: ${item.itemName} @ ${branch.name} (already exists)`);
            skippedCount++;
            continue;
          }

          // Create new threshold
          await prisma.inventoryThreshold.create({
            data: {
              companyId: item.companyId,
              warehouseItemId: item.id,
              branchId: branch.id,
              minLevel,
              parLevel: item.parLevel,
              criticalLevel,
              reorderQty,
            },
          });

          console.log(`  ✓ Created: ${item.itemName} @ ${branch.name} (min: ${minLevel}, par: ${item.parLevel}, critical: ${criticalLevel})`);
          createdCount++;
        } catch (error: any) {
          console.log(`  ✗ Error creating threshold for ${item.itemName} @ ${branch.name}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Backfill Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Thresholds created: ${createdCount}`);
    console.log(`⏭ Thresholds skipped: ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillThresholds()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
