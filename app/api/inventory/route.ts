import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication and get scoped context
    const { companyId } = await enforceAll(session);

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    // All authenticated users can read inventory
    // FIELD workers need this to create orders

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const branchId = searchParams.get('branchId');

    const where: any = {};
    if (category) where.category = category;
    if (branchId) where.branchId = branchId;

    const inventory = await scopedPrisma.warehouseInventory.findMany({
      where,
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    const categories = await scopedPrisma.warehouseInventory.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      inventory,
      categories: categories.map((c: { category: string }) => c.category),
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { itemName, category, parLevel, currentQty, unit, branchId } = body;

    if (!itemName || !category || !unit || !branchId || parLevel === undefined || currentQty === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await scopedPrisma.warehouseInventory.create({
      data: {
        itemName,
        category,
        parLevel,
        currentQty,
        unit,
        branchId,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { id, currentQty } = body;

    const updatedItem = await scopedPrisma.warehouseInventory.update({
      where: { id },
      data: {
        currentQty,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}
