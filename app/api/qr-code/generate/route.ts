import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import QRCode from 'qrcode';

/**
 * POST /api/qr-code/generate
 * Generate a QR code for a warehouse item (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, { role: 'ADMIN' });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get the item
    const item = await scopedPrisma.warehouseInventory.findUnique({
      where: { id: itemId },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Require SKU to generate QR code
    if (!item.sku) {
      return NextResponse.json(
        { error: 'SKU is required to generate a QR code. Please add an SKU first.' },
        { status: 400 }
      );
    }

    // Create QR code data (JSON)
    const qrData = {
      sku: item.sku,
      itemName: item.itemName,
      itemId: item.id,
      branchId: item.branchId,
      branchName: item.branch?.name || null,
    };

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });

    // Update item with QR code data
    const updatedItem = await scopedPrisma.warehouseInventory.update({
      where: { id: itemId },
      data: { qrCodeData: qrCodeDataUrl },
    });

    return NextResponse.json({
      message: 'QR code generated successfully',
      qrCodeData: qrCodeDataUrl,
      item: updatedItem,
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
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
