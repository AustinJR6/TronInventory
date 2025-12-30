import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET all routes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userRole, userId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP', 'DRIVER'],
      feature: 'routeManagement',
    });

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const driverId = searchParams.get('driverId');

    const routes = await prisma.route.findMany({
      where: {
        ...withCompanyScope(companyId),
        ...(active !== null && { active: active === 'true' }),
        // If user is a driver, only show their routes
        ...(userRole === 'DRIVER' ? { driverId: userId } : {}),
        // Filter by driver if specified
        ...(driverId && { driverId }),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            licenseNumber: true,
          },
        },
        _count: {
          select: {
            customers: true,
            deliveryOrders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(routes);
  } catch (error: any) {
    console.error('Get routes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new route
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN'],
      feature: 'routeManagement',
    });

    const data = await request.json();

    const route = await prisma.route.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        driverId: data.driverId,
        schedule: data.schedule,
        active: true,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error('Create route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
