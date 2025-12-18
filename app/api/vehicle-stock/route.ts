import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'FIELD') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleItems = await prisma.vehicleInventoryItem.findMany({
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    return NextResponse.json({ items: vehicleItems });
  } catch (error) {
    console.error('Error fetching vehicle items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'FIELD' || !session.user.vehicleNumber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weekEnding, items } = body;

    // Create vehicle stock record
    const vehicleStock = await prisma.vehicleStock.create({
      data: {
        userId: session.user.id,
        vehicleNumber: session.user.vehicleNumber,
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
      // Generate order number
      const orderCount = await prisma.order.count();
      const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

      // Find corresponding warehouse items
      const orderItems = await Promise.all(
        itemsNeedingRestock.map(async (stockItem) => {
          const warehouseItem = await prisma.warehouseInventory.findFirst({
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
        const order = await prisma.order.create({
          data: {
            orderNumber,
            userId: session.user.id,
            vehicleNumber: session.user.vehicleNumber,
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
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
