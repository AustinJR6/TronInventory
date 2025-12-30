import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET customer by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const customer = await prisma.customer.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
      include: {
        route: true,
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
            territory: true,
          },
        },
        parLevels: {
          include: {
            warehouseItem: true,
          },
        },
        inventory: {
          include: {
            warehouseItem: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: true,
            deliveryOrder: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update customer
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const data = await request.json();

    const customer = await prisma.customer.updateMany({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
      data: {
        businessName: data.businessName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        deliveryInstructions: data.deliveryInstructions,
        routeId: data.routeId,
        salesRepId: data.salesRepId,
        status: data.status,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
      },
    });

    if (customer.count === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE customer (soft delete by setting status to INACTIVE)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN'],
      feature: 'customerManagement',
    });

    await prisma.customer.updateMany({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
      data: {
        status: 'INACTIVE',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
