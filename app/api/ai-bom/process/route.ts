import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import { extractBomFromPdf } from '@/lib/bom-extractor';
import { matchBomItemToInventory } from '@/lib/bom-matcher';
import { getAbsolutePdfPath } from '@/lib/file-upload';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    // Parse request
    const { bomDraftId } = await request.json();

    if (!bomDraftId) {
      return NextResponse.json(
        { error: 'BOM draft ID is required' },
        { status: 400 }
      );
    }

    // Get draft
    const draft = await scopedPrisma.bomDraft.findUnique({
      where: { id: bomDraftId },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Check if already processing
    if (draft.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'Draft is already being processed' },
        { status: 400 }
      );
    }

    // Update status to processing
    await scopedPrisma.bomDraft.update({
      where: { id: bomDraftId },
      data: { status: 'PROCESSING', aiProcessingError: null },
    });

    try {
      // Get warehouse inventory for matching
      const inventory = await scopedPrisma.warehouseInventory.findMany({
        select: {
          id: true,
          itemName: true,
          sku: true,
          category: true,
          unit: true,
        },
      });

      if (inventory.length === 0) {
        throw new Error(
          'Your warehouse is empty - please add items before processing BOMs'
        );
      }

      // Extract BOM from PDF using AI
      const pdfPath = getAbsolutePdfPath(draft.pdfFilePath);
      const extractedItems = await extractBomFromPdf(pdfPath, inventory);

      // Match items and create BomItems
      const bomItemsData = extractedItems.map((item) => {
        const match = matchBomItemToInventory(item, inventory);
        return {
          bomDraftId,
          extractedItemName: item.itemName,
          extractedQuantity: item.quantity,
          extractedUnit: item.unit || null,
          extractedCategory: item.category || null,
          warehouseItemId: match.warehouseItemId,
          matchConfidence: match.confidence,
          aiMatchReason: match.reason,
        };
      });

      // Delete existing items if reprocessing
      await scopedPrisma.bomItem.deleteMany({
        where: { bomDraftId },
      });

      // Batch create items
      await scopedPrisma.bomItem.createMany({
        data: bomItemsData,
      });

      // Update draft status to processed
      const updatedDraft = await scopedPrisma.bomDraft.update({
        where: { id: bomDraftId },
        data: { status: 'PROCESSED' },
        include: {
          items: {
            include: {
              warehouseItem: {
                select: {
                  id: true,
                  itemName: true,
                  category: true,
                  unit: true,
                  currentQty: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        bomDraft: updatedDraft,
        message: `Successfully extracted ${extractedItems.length} items from planset`,
      });
    } catch (processingError: any) {
      // Update draft with error
      await scopedPrisma.bomDraft.update({
        where: { id: bomDraftId },
        data: {
          status: 'FAILED',
          aiProcessingError: processingError.message,
        },
      });

      throw processingError;
    }
  } catch (error: any) {
    console.error('BOM processing error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Processing failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
