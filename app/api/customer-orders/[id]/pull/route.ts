import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// POST pull items for customer order (warehouse operation)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
      feature: 'customerManagement',
    });

    const { items } = await request.json(); // Array of { itemId, pulledQty }

    // Verify order belongs to company
    const order = await prisma.customerOrder.findFirst({
      where: {
        id: params.id,
        ...withCompanyScope(companyId),
      },
      include: {
        items: {
          include: {
            warehouseItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'SUBMITTED' && order.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Order must be SUBMITTED or APPROVED to pull items' },
        { status: 400 }
      );
    }

    // Update each item's pulled quantity and decrement warehouse inventory
    for (const itemUpdate of items) {
      const orderItem = order.items.find((i) => i.id === itemUpdate.itemId);
      if (!orderItem) continue;

      // Update order item
      await prisma.customerOrderItem.update({
        where: { id: itemUpdate.itemId },
        data: { pulledQty: itemUpdate.pulledQty },
      });

      // Decrement warehouse inventory
      await prisma.warehouseInventory.update({
        where: { id: orderItem.warehouseItemId },
        data: {
          currentQty: {
            decrement: itemUpdate.pulledQty,
          },
        },
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          companyId,
          itemId: orderItem.warehouseItemId,
          delta: -itemUpdate.pulledQty,
          reason: `Pulled for customer order ${order.orderNumber}`,
          source: 'customer_order',
          createdBy: session.user.id,
        },
      });
    }

    // Update order status to PULLED
    await prisma.customerOrder.update({
      where: { id: params.id },
      data: { status: 'PULLED' },
    });

    return NextResponse.json({ success: true, message: 'Items pulled successfully' });
  } catch (error: any) {
    console.error('Pull customer order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
