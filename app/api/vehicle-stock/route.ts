import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: 'FIELD',
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const vehicleItems = await scopedPrisma.vehicleInventoryItem.findMany({
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    return NextResponse.json({ items: vehicleItems });
  } catch (error: any) {
    console.error('Error fetching vehicle items:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId, userId } = await enforceAll(session, {
      role: 'FIELD',
    });

    if (!session.user.vehicleNumber) {
      return NextResponse.json({ error: 'Vehicle number required for field users' }, { status: 400 });
    }

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { weekEnding, items } = body;

    // Create vehicle stock record
    const vehicleStock = await scopedPrisma.vehicleStock.create({
      data: {
        userId,
        vehicleNumber: session.user.vehicleNumber,
        branchId: session.user.branchId || null,
        weekEnding: new Date(weekEnding),
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            expectedQty: item.expectedQty,
            actualQty: item.actualQty,
            difference: item.expectedQty - item.actualQty,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    // Generate order for items that need restocking
    const itemsNeedingRestock = vehicleStock.items.filter(
      (item) => item.difference > 0
    );

    if (itemsNeedingRestock.length > 0) {
      // Generate order number (scoped to company)
      const orderCount = await scopedPrisma.order.count();
      const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

      // Find corresponding warehouse items (already scoped to company)
      const orderItems = await Promise.all(
        itemsNeedingRestock.map(async (stockItem) => {
          const warehouseItem = await scopedPrisma.warehouseInventory.findFirst({
            where: { itemName: stockItem.item.itemName },
          });

          return warehouseItem
            ? {
                warehouseItemId: warehouseItem.id,
                requestedQty: stockItem.difference,
              }
            : null;
        })
      );

      const validOrderItems = orderItems.filter((item) => item !== null);

      if (validOrderItems.length > 0) {
        const order = await scopedPrisma.order.create({
          data: {
            orderNumber,
            userId,
            vehicleNumber: session.user.vehicleNumber,
            branchId: session.user.branchId || null,
            orderType: 'WEEKLY_STOCK',
            vehicleStockId: vehicleStock.id,
            items: {
              create: validOrderItems,
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
          vehicleStock,
          order,
          message: 'Vehicle stock submitted and order created successfully',
        });
      }
    }

    return NextResponse.json({
      vehicleStock,
      message: 'Vehicle stock submitted successfully (no items to restock)',
    });
  } catch (error: any) {
    console.error('Error creating vehicle stock:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({
      error: error.message || 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status });
  }
}
