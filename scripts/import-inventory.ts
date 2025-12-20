import { PrismaClient } from '@prisma/client';
import { openai } from '../lib/openai-client';
import path from 'path';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();

async function extractPdfText(pdfPath: string): Promise<string> {
  const dataBuffer = await readFile(pdfPath);
  const { PDFParse } = require('pdf-parse');
  const data = await PDFParse(dataBuffer);
  return data.text;
}

async function extractInventoryFromPdf(pdfPath: string, inventoryType: 'warehouse' | 'vehicle') {
  console.log(`\nExtracting items from ${path.basename(pdfPath)}...`);

  const pdfText = await extractPdfText(pdfPath);

  const prompt = `Extract all inventory items from this ${inventoryType} inventory list.
For each item, extract:
- itemName: the product name
- quantity: the current quantity (number only)
- unit: the unit of measurement (ea, ft, box, etc.)
- category: the category or type of item
- sku: SKU or part number if available

Return ONLY a valid JSON array of objects with these exact fields. No markdown, no explanation.
Example format:
[
  {"itemName": "Wire Nuts", "quantity": 100, "unit": "ea", "category": "Electrical", "sku": "WN-123"},
  {"itemName": "Conduit 1/2\"", "quantity": 50, "unit": "ft", "category": "Conduit", "sku": null}
]

PDF Content:
${pdfText}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const content = response.choices[0].message.content || '[]';

  // Remove markdown code blocks if present
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const items = JSON.parse(jsonContent);
    console.log(`Extracted ${items.length} items`);
    return items;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Response:', content);
    return [];
  }
}

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

    // Extract warehouse inventory
    const warehousePdf = path.join(process.cwd(), 'Warehouse_BOS_Inventory_Tron.pdf');
    const warehouseItems = await extractInventoryFromPdf(warehousePdf, 'warehouse');

    console.log('\nImporting warehouse inventory...');
    for (const item of warehouseItems) {
      await prisma.warehouseInventory.create({
        data: {
          companyId: tronCompany.id,
          itemName: item.itemName,
          category: item.category || 'General',
          sku: item.sku || `WH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          currentQty: item.quantity || 0,
          minQty: Math.floor((item.quantity || 0) * 0.2), // Set min to 20% of current
          unit: item.unit || 'ea',
        }
      });
      console.log(`  ✓ Added: ${item.itemName} (${item.quantity} ${item.unit})`);
    }
    console.log(`✅ Imported ${warehouseItems.length} warehouse items`);

    // Extract vehicle inventory
    const vehiclePdf = path.join(process.cwd(), 'Standard_Battery_Team_Van_Loadout.pdf');
    const vehicleItems = await extractInventoryFromPdf(vehiclePdf, 'vehicle');

    console.log('\nImporting vehicle inventory items...');
    for (const item of vehicleItems) {
      await prisma.vehicleInventoryItem.create({
        data: {
          companyId: tronCompany.id,
          itemName: item.itemName,
          category: item.category || 'General',
          sku: item.sku || `VH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          standardQty: item.quantity || 0,
          unit: item.unit || 'ea',
        }
      });
      console.log(`  ✓ Added: ${item.itemName} (${item.quantity} ${item.unit})`);
    }
    console.log(`✅ Imported ${vehicleItems.length} vehicle inventory items`);

    console.log('\n🎉 Import complete!');
    console.log(`Total warehouse items: ${warehouseItems.length}`);
    console.log(`Total vehicle items: ${vehicleItems.length}`);

  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importInventory();
