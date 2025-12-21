import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, { role: ['ADMIN', 'FIELD'] });
    const scopedPrisma = withCompanyScope(companyId);

    // Parse request
    const { bomDraftId, branchId, notes, vehicleNumber } = await request.json();

    if (!bomDraftId) {
      return NextResponse.json(
        { error: 'BOM draft ID is required' },
        { status: 400 }
      );
    }

    // Get draft with items
    const draft = await scopedPrisma.bomDraft.findUnique({
      where: { id: bomDraftId },
      include: {
        items: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Validate all items have warehouse matches
    const unmatchedItems = draft.items.filter((item: any) => !item.warehouseItemId);
    if (unmatchedItems.length > 0) {
      return NextResponse.json(
        {
          error: 'All items must have warehouse matches before submitting',
          unmatchedItems: unmatchedItems.map((item: any) => ({
            id: item.id,
            name: item.extractedItemName,
          })),
        },
        { status: 400 }
      );
    }

    // Generate order number with BOM prefix
    const orderCount = await scopedPrisma.order.count();
    const orderNumber = `BOM-${String(orderCount + 1).padStart(6, '0')}`;

    // Get user's vehicle number or use provided one
    const user = await scopedPrisma.user.findUnique({
      where: { id: userId },
      select: { vehicleNumber: true },
    });

    const finalVehicleNumber =
      vehicleNumber || user?.vehicleNumber || 'AI-BOM';

    // Create order from BOM
    const order = await scopedPrisma.order.create({
      data: {
        orderNumber,
        userId,
        vehicleNumber: finalVehicleNumber,
        orderType: 'AD_HOC',
        branchId: branchId || null,
        notes: notes
          ? `${notes}\n\n📄 Generated from AI BOM: ${draft.name}`
          : `📄 Generated from AI BOM: ${draft.name}`,
        items: {
          create: draft.items.map((item: any) => ({
            warehouseItemId: item.warehouseItemId!,
            requestedQty: item.extractedQuantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            warehouseItem: true,
          },
        },
      },
    });

    // Update draft status and link to order
    await scopedPrisma.bomDraft.update({
      where: { id: bomDraftId },
      data: {
        status: 'SUBMITTED',
        orderId: order.id,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      order,
      message: `Order ${orderNumber} created successfully from AI BOM`,
    });
  } catch (error: any) {
    console.error('Submit BOM order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order from BOM' },
      { status: 500 }
    );
  }
}
