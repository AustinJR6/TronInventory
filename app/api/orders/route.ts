import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication and get scoped context
    const { companyId, userId, userRole } = await enforceAll(session);

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    let where: any = {};

    // FIELD users can only see their own orders
    if (userRole === 'FIELD') {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const orders = await scopedPrisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
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
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId, userId } = await enforceAll(session, {
      role: ['ADMIN', 'FIELD'],
    });

    // Vehicle number is optional for ADMIN users
    const vehicleNumber = session?.user?.vehicleNumber || 'ADMIN-ORDER';

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { items, notes, branchId } = body;

    // Generate order number (scoped to company)
    const orderCount = await scopedPrisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    const order = await scopedPrisma.order.create({
      data: {
        orderNumber,
        userId,
        vehicleNumber,
        orderType: 'AD_HOC',
        notes,
        branchId: branchId || null,
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
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({
      error: error.message || 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { orderId, status, itemUpdates } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    const order = await scopedPrisma.order.update({
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
        await scopedPrisma.orderItem.update({
          where: { id: update.itemId },
          data: { pulledQty: update.pulledQty },
        });

        // Update warehouse inventory
        await scopedPrisma.warehouseInventory.update({
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
  } catch (error: any) {
    console.error('Error updating order:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}
