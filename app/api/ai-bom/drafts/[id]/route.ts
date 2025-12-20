import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    const { id } = await params;

    // Fetch draft with all details
    const draft = await scopedPrisma.bomDraft.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            warehouseItem: {
              select: {
                id: true,
                itemName: true,
                category: true,
                unit: true,
                currentQty: true,
                sku: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ bomDraft: draft });
  } catch (error: any) {
    console.error('Fetch draft detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    const { id } = await params;
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Update each item
    await Promise.all(
      items.map((item: any) =>
        scopedPrisma.bomItem.update({
          where: { id: item.id },
          data: {
            warehouseItemId: item.warehouseItemId,
            extractedQuantity: item.extractedQuantity,
            manuallyOverridden: item.manuallyOverridden || true,
            notes: item.notes || null,
          },
        })
      )
    );

    // Fetch updated draft
    const updatedDraft = await scopedPrisma.bomDraft.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            warehouseItem: true,
          },
        },
      },
    });

    return NextResponse.json({
      bomDraft: updatedDraft,
      message: 'Draft updated successfully',
    });
  } catch (error: any) {
    console.error('Update draft error:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    const { id } = await params;

    // Delete draft (cascades to items)
    await scopedPrisma.bomDraft.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Draft deleted successfully' });
  } catch (error: any) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
