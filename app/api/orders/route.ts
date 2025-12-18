import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let where: any = {};

    if (session.user.role === 'FIELD') {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
        items: {
          include: {
            warehouseItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'FIELD' || !session.user.vehicleNumber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, notes } = body;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        vehicleNumber: session.user.vehicleNumber,
        orderType: 'AD_HOC',
        notes,
        items: {
          create: items.map((item: any) => ({
            warehouseItemId: item.warehouseItemId,
            requestedQty: item.requestedQty,
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

    return NextResponse.json({
      order,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, itemUpdates } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            warehouseItem: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
      },
    });

    // Update item pulled quantities if provided
    if (itemUpdates && Array.isArray(itemUpdates)) {
      for (const update of itemUpdates) {
        await prisma.orderItem.update({
          where: { id: update.itemId },
          data: { pulledQty: update.pulledQty },
        });

        // Update warehouse inventory
        await prisma.warehouseInventory.update({
          where: { id: update.warehouseItemId },
          data: {
            currentQty: {
              decrement: update.pulledQty,
            },
          },
        });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
