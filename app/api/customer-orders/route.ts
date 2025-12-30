import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET all customer orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userRole, userId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP', 'DRIVER'],
      feature: 'customerManagement',
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const orders = await prisma.customerOrder.findMany({
      where: {
        ...withCompanyScope(companyId),
        ...(status && { status: status as any }),
        ...(customerId && { customerId }),
        // Sales reps see their own orders
        ...(userRole === 'SALES_REP' ? { salesRepId: userId } : {}),
        // Drivers see orders assigned to them
        ...(userRole === 'DRIVER' ? { deliveryOrder: { driverId: userId } } : {}),
      },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            warehouseItem: true,
          },
        },
        deliveryOrder: {
          include: {
            route: true,
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Get customer orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new customer order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, {
      role: ['ADMIN', 'SALES_REP', 'CUSTOMER_USER'],
      feature: 'customerManagement',
    });

    const data = await request.json();

    // Generate order number
    const count = await prisma.customerOrder.count({
      where: withCompanyScope(companyId),
    });
    const orderNumber = `CO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of data.items) {
      const warehouseItem = await prisma.warehouseInventory.findUnique({
        where: { id: item.warehouseItemId },
      });
      if (warehouseItem) {
        // You can add pricing logic here
        item.unitPrice = item.unitPrice || 0;
        item.lineTotal = item.requestedQty * item.unitPrice;
        subtotal += item.lineTotal;
      }
    }

    const tax = subtotal * 0.0; // Add tax calculation if needed
    const total = subtotal + tax;

    const order = await prisma.customerOrder.create({
      data: {
        companyId,
        orderNumber,
        customerId: data.customerId,
        createdById: userId,
        salesRepId: data.salesRepId || userId,
        orderType: data.orderType || 'STANDARD',
        status: 'SUBMITTED',
        subtotal,
        tax,
        total,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            warehouseItemId: item.warehouseItemId,
            requestedQty: item.requestedQty,
            unitPrice: item.unitPrice || 0,
            lineTotal: item.lineTotal || 0,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            warehouseItem: true,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Create customer order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
