import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET customer par levels
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const parLevels = await prisma.customerParLevel.findMany({
      where: {
        customerId: (await params).id,
      },
      include: {
        warehouseItem: true,
      },
      orderBy: {
        warehouseItem: {
          name: 'asc',
        },
      },
    });

    return NextResponse.json(parLevels);
  } catch (error: any) {
    console.error('Get par levels error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST update/create par level
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const data = await request.json();
    const { warehouseItemId, parLevel } = data;

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify warehouse item belongs to company
    const warehouseItem = await prisma.warehouseInventory.findFirst({
      where: {
        id: warehouseItemId,
        ...withCompanyScope(companyId),
      },
    });

    if (!warehouseItem) {
      return NextResponse.json(
        { error: 'Warehouse item not found' },
        { status: 404 }
      );
    }

    // If parLevel is 0 or null, delete the par level
    if (!parLevel || parLevel === 0) {
      await prisma.customerParLevel.deleteMany({
        where: {
          customerId: (await params).id,
          warehouseItemId,
        },
      });

      return NextResponse.json({ deleted: true });
    }

    // Upsert par level
    const updatedParLevel = await prisma.customerParLevel.upsert({
      where: {
        customerId_warehouseItemId: {
          customerId: (await params).id,
          warehouseItemId,
        },
      },
      update: {
        parLevel,
      },
      create: {
        customerId: (await params).id,
        warehouseItemId,
        parLevel,
      },
      include: {
        warehouseItem: true,
      },
    });

    return NextResponse.json(updatedParLevel);
  } catch (error: any) {
    console.error('Update par level error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE par level
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const { searchParams } = new URL(request.url);
    const warehouseItemId = searchParams.get('warehouseItemId');

    if (!warehouseItemId) {
      return NextResponse.json(
        { error: 'Warehouse item ID required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: (await params).id,
        ...withCompanyScope(companyId),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await prisma.customerParLevel.deleteMany({
      where: {
        customerId: (await params).id,
        warehouseItemId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete par level error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
