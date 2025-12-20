import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

/**
 * POST /api/qr-code/scan
 * Process a scanned QR code and return item details
 * Accessible by ADMIN and WAREHOUSE roles
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    // Parse QR code data
    let parsedData: {
      sku: string;
      itemName: string;
      itemId: string;
      branchId: string | null;
      branchName: string | null;
    };

    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!parsedData.itemId) {
      return NextResponse.json(
        { error: 'QR code is missing item ID' },
        { status: 400 }
      );
    }

    // Fetch the item
    const item = await scopedPrisma.warehouseInventory.findUnique({
      where: { id: parsedData.itemId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Log the scan in inventory transactions
    await scopedPrisma.inventoryTransaction.create({
      data: {
        itemId: item.id,
        delta: 0, // No quantity change for scan
        reason: `QR code scanned`,
        source: 'qr_scan',
        createdBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        itemName: item.itemName,
        sku: item.sku,
        category: item.category,
        currentQty: item.currentQty,
        parLevel: item.parLevel,
        unit: item.unit,
        branchId: item.branchId,
        branch: item.branch,
        qrCodeData: item.qrCodeData,
      },
    });
  } catch (error: any) {
    console.error('Error processing QR scan:', error);
    const status = error.message?.includes('required')
      ? 401
      : error.message?.includes('Access denied')
      ? 403
      : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}
