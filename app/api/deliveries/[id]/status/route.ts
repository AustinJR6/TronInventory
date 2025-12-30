import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// PATCH update delivery status
export async function PATCH(
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
    const { status, driverNotes } = data;

    // Verify delivery belongs to company
    const delivery = await prisma.deliveryOrder.findFirst({
      where: {
        id: params.id,
        ...withCompanyScope(companyId),
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Drivers can only update their own deliveries
    if (userRole === 'DRIVER' && delivery.driverId !== userId) {
      return NextResponse.json(
        { error: 'You can only update your own deliveries' },
        { status: 403 }
      );
    }

    // Prepare update data based on status
    const updateData: any = {
      status,
      ...(driverNotes && { driverNotes }),
    };

    // Set timestamps based on status
    if (status === 'IN_TRANSIT' && !delivery.departedAt) {
      updateData.departedAt = new Date();
    } else if (status === 'ARRIVED' && !delivery.arrivedAt) {
      updateData.arrivedAt = new Date();
    }

    const updatedDelivery = await prisma.deliveryOrder.update({
      where: { id: params.id },
      data: updateData,
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
    if (status === 'IN_TRANSIT') {
      await prisma.customerOrder.update({
        where: { id: delivery.customerOrderId },
        data: { status: 'OUT_FOR_DELIVERY' },
      });
    }

    return NextResponse.json(updatedDelivery);
  } catch (error: any) {
    console.error('Update delivery status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
