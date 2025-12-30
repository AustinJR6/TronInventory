import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

// GET customer inventory
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE', 'SALES_REP'],
      feature: 'customerManagement',
    });

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        ...withCompanyScope(companyId),
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const inventory = await prisma.customerInventory.findMany({
      where: {
        customerId: params.id,
      },
      include: {
        warehouseItem: true,
        customer: {
          include: {
            parLevels: {
              where: {
                customerId: params.id,
              },
            },
          },
        },
      },
    });

    // Calculate needed quantities based on par levels
    const inventoryWithNeeds = inventory.map((item) => {
      const parLevel = item.customer.parLevels.find(
        (pl) => pl.warehouseItemId === item.warehouseItemId
      );
      const needed = parLevel ? Math.max(0, parLevel.parLevel - item.currentQty) : 0;

      return {
        ...item,
        parLevel: parLevel?.parLevel || 0,
        needed,
      };
    });

    return NextResponse.json(inventoryWithNeeds);
  } catch (error: any) {
    console.error('Get customer inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST update customer inventory (sales rep counting)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, {
      role: ['ADMIN', 'SALES_REP'],
      feature: 'customerManagement',
    });

    const { warehouseItemId, currentQty } = await request.json();

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        ...withCompanyScope(companyId),
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Upsert customer inventory
    const inventory = await prisma.customerInventory.upsert({
      where: {
        customerId_warehouseItemId: {
          customerId: params.id,
          warehouseItemId,
        },
      },
      update: {
        currentQty,
        lastCountDate: new Date(),
        lastCountBy: userId,
      },
      create: {
        customerId: params.id,
        warehouseItemId,
        currentQty,
        lastCountDate: new Date(),
        lastCountBy: userId,
      },
      include: {
        warehouseItem: true,
      },
    });

    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error('Update customer inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
