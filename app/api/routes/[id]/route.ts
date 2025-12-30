import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET single route
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP', 'DRIVER'],
      feature: 'routeManagement',
    });

    const route = await prisma.route.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customers: {
          include: {
            salesRep: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        deliveries: {
          where: {
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          include: {
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error: any) {
    console.error('Get route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update route
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
      feature: 'routeManagement',
    });

    const data = await request.json();

    // Verify route belongs to company
    const existingRoute = await prisma.route.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
    });

    if (!existingRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const route = await prisma.route.update({
      where: { id: (await params).id },
      data: {
        name: data.name,
        description: data.description,
        driverId: data.driverId,
        daysOfWeek: data.daysOfWeek,
        isActive: data.isActive,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            customers: true,
            deliveries: true,
          },
        },
      },
    });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error('Update route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE route
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN'],
      feature: 'routeManagement',
    });

    // Verify route belongs to company
    const route = await prisma.route.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
      include: {
        _count: {
          select: {
            customers: true,
            deliveries: true,
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Check if route has customers or deliveries
    if (route._count.customers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete route with assigned customers. Please reassign customers first.' },
        { status: 400 }
      );
    }

    if (route._count.deliveries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete route with delivery history.' },
        { status: 400 }
      );
    }

    await prisma.route.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
