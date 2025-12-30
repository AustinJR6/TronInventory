import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET all deliveries
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userRole, userId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'DRIVER'],
      feature: 'deliveryTracking',
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const routeId = searchParams.get('routeId');

    const deliveries = await prisma.deliveryOrder.findMany({
      where: {
        ...withCompanyScope(companyId),
        ...(status && { status: status as any }),
        ...(userRole === 'DRIVER' ? { driverId: userId } : {}),
        ...(driverId && { driverId }),
        ...(routeId && { routeId }),
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
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json(deliveries);
  } catch (error: any) {
    console.error('Get deliveries error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create delivery (when loading order onto truck)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
      feature: 'deliveryTracking',
    });

    const data = await request.json();

    // Verify customer order belongs to company and is PULLED
    const customerOrder = await prisma.customerOrder.findFirst({
      where: {
        id: data.customerOrderId,
        ...withCompanyScope(companyId),
        status: 'PULLED',
      },
      include: {
        customer: true,
      },
    });

    if (!customerOrder) {
      return NextResponse.json(
        { error: 'Customer order not found or not in PULLED status' },
        { status: 404 }
      );
    }

    // Generate delivery number
    const count = await prisma.deliveryOrder.count({
      where: withCompanyScope(companyId),
    });
    const deliveryNumber = `DEL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create delivery order
    const delivery = await prisma.deliveryOrder.create({
      data: {
        companyId,
        deliveryNumber,
        routeId: data.routeId || customerOrder.customer.routeId!,
        driverId: data.driverId,
        customerOrderId: data.customerOrderId,
        scheduledDate: data.scheduledDate || new Date(),
        loadedAt: new Date(),
        status: 'LOADED',
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
            items: true,
          },
        },
      },
    });

    // Update customer order status to LOADED
    await prisma.customerOrder.update({
      where: { id: data.customerOrderId },
      data: {
        status: 'LOADED',
        deliveryOrderId: delivery.id,
      },
    });

    return NextResponse.json(delivery);
  } catch (error: any) {
    console.error('Create delivery error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
