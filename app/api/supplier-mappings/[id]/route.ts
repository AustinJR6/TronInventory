import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

/**
 * PATCH /api/supplier-mappings/[id]
 * Update a supplier item mapping
 * Required roles: ADMIN, WAREHOUSE
 * License: OPS_SCAN_PO tier
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      requiredRoles: ['ADMIN', 'WAREHOUSE'],
      requiredFeatures: ['purchaseOrders'],
    });

    const { id } = await params;
    const prisma = withCompanyScope(companyId);
    const body = await request.json();

    // Verify mapping exists
    const existing = await prisma.supplierItemMapping.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Supplier mapping not found' },
        { status: 404 }
      );
    }

    const {
      supplierSKU,
      packSize,
      unitCost,
      moq,
      preferredSupplier,
      leadTimeDays,
      notes,
      active,
    } = body;

    // Validate unit cost if provided
    if (unitCost !== undefined && parseFloat(unitCost) <= 0) {
      return NextResponse.json(
        { error: 'Unit cost must be greater than 0' },
        { status: 400 }
      );
    }

    // If setting as preferred, unset other preferred suppliers for this item
    if (preferredSupplier && !existing.preferredSupplier) {
      await prisma.supplierItemMapping.updateMany({
        where: {
          warehouseItemId: existing.warehouseItemId,
          preferredSupplier: true,
          id: { not: id },
        },
        data: {
          preferredSupplier: false,
        },
      });
    }

    // Build update data
    const updateData: any = {};
    if (supplierSKU !== undefined)
      updateData.supplierSKU = supplierSKU?.trim() || null;
    if (packSize !== undefined) updateData.packSize = parseInt(packSize, 10);
    if (unitCost !== undefined) updateData.unitCost = parseFloat(unitCost);
    if (moq !== undefined) updateData.moq = parseInt(moq, 10);
    if (preferredSupplier !== undefined)
      updateData.preferredSupplier = preferredSupplier;
    if (leadTimeDays !== undefined)
      updateData.leadTimeDays = leadTimeDays ? parseInt(leadTimeDays, 10) : null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (active !== undefined) updateData.active = active;

    // Update mapping
    const mapping = await prisma.supplierItemMapping.update({
      where: { id },
      data: updateData,
      include: {
        warehouseItem: {
          select: {
            id: true,
            itemName: true,
            category: true,
            unit: true,
          },
        },
        distributor: {
          select: {
            id: true,
            name: true,
            defaultLeadDays: true,
          },
        },
      },
    });

    return NextResponse.json({ mapping });
  } catch (error: any) {
    console.error('Error updating supplier mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update supplier mapping' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/supplier-mappings/[id]
 * Delete a supplier item mapping
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
      requiredRoles: ['ADMIN'],
      requiredFeatures: ['purchaseOrders'],
    });

    const { id } = await params;
    const prisma = withCompanyScope(companyId);

    // Verify mapping exists
    const existing = await prisma.supplierItemMapping.findFirst({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Supplier mapping not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active = false
    await prisma.supplierItemMapping.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting supplier mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete supplier mapping' },
      { status: 500 }
    );
  }
}
