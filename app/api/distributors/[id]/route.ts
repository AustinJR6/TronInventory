import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

/**
 * GET /api/distributors/[id]
 * Get a single distributor with item mappings
 * Required roles: ADMIN, WAREHOUSE
 * License: OPS_SCAN_PO tier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    const { id } = await params;
    const prisma = withCompanyScope(companyId);

    const distributor = await prisma.distributor.findFirst({
      where: { id },
      include: {
        itemMappings: {
          include: {
            warehouseItem: {
              select: {
                id: true,
                itemName: true,
                category: true,
                unit: true,
              },
            },
          },
          orderBy: {
            warehouseItem: {
              itemName: 'asc',
            },
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ distributor });
  } catch (error: any) {
    console.error('Error fetching distributor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch distributor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/distributors/[id]
 * Update a distributor
 * Required roles: ADMIN
 * License: OPS_SCAN_PO tier
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    const { id } = await params;
    const prisma = withCompanyScope(companyId);
    const body = await request.json();

    // Verify distributor exists
    const existing = await prisma.distributor.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    const {
      name,
      contactName,
      email,
      phone,
      website,
      orderingMethod,
      defaultLeadDays,
      notes,
      active,
    } = body;

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.distributor.findFirst({
        where: {
          name: name.trim(),
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A distributor with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactName !== undefined)
      updateData.contactName = contactName?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (website !== undefined) updateData.website = website?.trim() || null;
    if (orderingMethod !== undefined)
      updateData.orderingMethod = orderingMethod?.trim() || null;
    if (defaultLeadDays !== undefined)
      updateData.defaultLeadDays = parseInt(defaultLeadDays, 10);
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (active !== undefined) updateData.active = active;

    // Update distributor
    const distributor = await prisma.distributor.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            itemMappings: true,
            purchaseOrders: true,
          },
        },
      },
    });

    return NextResponse.json({ distributor });
  } catch (error: any) {
    console.error('Error updating distributor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update distributor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/distributors/[id]
 * Soft delete a distributor (sets active = false)
 * Required roles: ADMIN
 * License: OPS_SCAN_PO tier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    const { id } = await params;
    const prisma = withCompanyScope(companyId);

    // Verify distributor exists
    const existing = await prisma.distributor.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // Check if distributor has active purchase orders
    const activePOCount = await prisma.purchaseOrder.count({
      where: {
        distributorId: id,
        status: {
          in: ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'PARTIAL_RECEIVED'],
        },
      },
    });

    if (activePOCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete distributor with ${activePOCount} active purchase orders. Please complete or cancel them first.`,
        },
        { status: 409 }
      );
    }

    // Soft delete by setting active = false
    const distributor = await prisma.distributor.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ distributor });
  } catch (error: any) {
    console.error('Error deleting distributor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete distributor' },
      { status: 500 }
    );
  }
}
