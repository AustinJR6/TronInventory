import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All authenticated users can read inventory
    // FIELD workers need this to create orders

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const where = category ? { category } : {};

    const inventory = await prisma.warehouseInventory.findMany({
      where,
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    const categories = await prisma.warehouseInventory.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      inventory,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemName, category, parLevel, currentQty, unit } = body;

    if (!itemName || !category || !unit || parLevel === undefined || currentQty === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await prisma.warehouseInventory.create({
      data: {
        itemName,
        category,
        parLevel,
        currentQty,
        unit,
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'WAREHOUSE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, currentQty } = body;

    const updatedItem = await prisma.warehouseInventory.update({
      where: { id },
      data: {
        currentQty,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
