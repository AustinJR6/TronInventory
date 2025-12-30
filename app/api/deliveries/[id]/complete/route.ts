import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// POST complete delivery
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId, userRole } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'DRIVER'],
      feature: 'deliveryTracking',
    });

    const data = await request.json();
    const { signature, driverNotes } = data;

    // Verify delivery belongs to company
    const delivery = await prisma.deliveryOrder.findFirst({
      where: {
        id: params.id,
        ...withCompanyScope(companyId),
      },
      include: {
        customerOrder: {
          include: {
            items: {
              include: {
                warehouseItem: true,
              },
            },
            customer: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Drivers can only complete their own deliveries
    if (userRole === 'DRIVER' && delivery.driverId !== userId) {
      return NextResponse.json(
        { error: 'You can only complete your own deliveries' },
        { status: 403 }
      );
    }

    // Complete the delivery
    const updatedDelivery = await prisma.deliveryOrder.update({
      where: { id: params.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        signature,
        ...(driverNotes && { driverNotes }),
      },
      include: {
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customerOrder: {
          include: {
            customer: true,
            items: {
              include: {
                warehouseItem: true,
              },
            },
          },
        },
      },
    });

    // Update customer order status
    await prisma.customerOrder.update({
      where: { id: delivery.customerOrderId },
      data: { status: 'DELIVERED' },
    });

    // Add delivered items to customer inventory
    for (const item of delivery.customerOrder.items) {
      const pulledQty = item.pulledQty || 0;

      if (pulledQty > 0) {
        await prisma.customerInventory.upsert({
          where: {
            customerId_warehouseItemId: {
              customerId: delivery.customerOrder.customerId,
              warehouseItemId: item.warehouseItemId,
            },
          },
          update: {
            currentQty: {
              increment: pulledQty,
            },
          },
          create: {
            customerId: delivery.customerOrder.customerId,
            warehouseItemId: item.warehouseItemId,
            currentQty: pulledQty,
            lastCountDate: new Date(),
            lastCountBy: userId,
          },
        });
      }
    }

    return NextResponse.json(updatedDelivery);
  } catch (error: any) {
    console.error('Complete delivery error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
