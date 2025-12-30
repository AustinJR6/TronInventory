import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET all customers
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userRole } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const salesRepId = searchParams.get('salesRepId');
    const routeId = searchParams.get('routeId');

    const customers = await prisma.customer.findMany({
      where: {
        ...withCompanyScope(companyId),
        ...(status && { status: status as any }),
        ...(salesRepId && { salesRepId }),
        ...(routeId && { routeId }),
      },
      include: {
        route: true,
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            orders: true,
            inventory: true,
          },
        },
      },
      orderBy: { businessName: 'asc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Get customers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new customer
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, {
      role: ['ADMIN', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const data = await request.json();

    // Generate account number if not provided
    let accountNumber = data.accountNumber;
    if (!accountNumber) {
      const count = await prisma.customer.count({
        where: withCompanyScope(companyId),
      });
      accountNumber = `CUST-${String(count + 1).padStart(5, '0')}`;
    }

    const customer = await prisma.customer.create({
      data: {
        companyId,
        businessName: data.businessName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        deliveryInstructions: data.deliveryInstructions,
        accountNumber,
        routeId: data.routeId,
        salesRepId: data.salesRepId || userId,
        status: 'ACTIVE',
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
      },
      include: {
        route: true,
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
