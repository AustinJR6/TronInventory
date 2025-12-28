import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

/**
 * GET /api/supplier-mappings
 * List supplier item mappings
 * Query params:
 *  - warehouseItemId: Filter by warehouse item
 *  - distributorId: Filter by distributor
 *  - preferredOnly: Show only preferred suppliers
 * Required roles: ADMIN, WAREHOUSE
 * License: OPS_SCAN_PO tier
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    const prisma = withCompanyScope(companyId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const warehouseItemId = searchParams.get('warehouseItemId');
    const distributorId = searchParams.get('distributorId');
    const preferredOnly = searchParams.get('preferredOnly') === 'true';

    // Build where clause
    const where: any = { active: true };
    if (warehouseItemId) {
      where.warehouseItemId = warehouseItemId;
    }
    if (distributorId) {
      where.distributorId = distributorId;
    }
    if (preferredOnly) {
      where.preferredSupplier = true;
    }

    // Fetch mappings with related data
    const mappings = await prisma.supplierItemMapping.findMany({
      where,
      include: {
        warehouseItem: {
          select: {
            id: true,
            itemName: true,
            category: true,
            unit: true,
            parLevel: true,
          },
        },
        distributor: {
          select: {
            id: true,
            name: true,
            defaultLeadDays: true,
            active: true,
          },
        },
      },
      orderBy: [
        { warehouseItem: { itemName: 'asc' } },
        { preferredSupplier: 'desc' },
      ],
    });

    return NextResponse.json({ mappings });
  } catch (error: any) {
    console.error('Error fetching supplier mappings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch supplier mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supplier-mappings
 * Create a new supplier item mapping
 * Required roles: ADMIN, WAREHOUSE
 * License: OPS_SCAN_PO tier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });

    const prisma = withCompanyScope(companyId);
    const body = await request.json();

    const {
      warehouseItemId,
      distributorId,
      supplierSKU,
      packSize,
      unitCost,
      moq,
      preferredSupplier,
      leadTimeDays,
      notes,
    } = body;

    // Validate required fields
    if (!warehouseItemId) {
      return NextResponse.json(
        { error: 'Warehouse item ID is required' },
        { status: 400 }
      );
    }

    if (!distributorId) {
      return NextResponse.json(
        { error: 'Distributor ID is required' },
        { status: 400 }
      );
    }

    if (!unitCost || parseFloat(unitCost) <= 0) {
      return NextResponse.json(
        { error: 'Valid unit cost is required' },
        { status: 400 }
      );
    }

    // Verify warehouse item exists
    const warehouseItem = await prisma.warehouseInventory.findFirst({
      where: { id: warehouseItemId },
    });

    if (!warehouseItem) {
      return NextResponse.json(
        { error: 'Warehouse item not found' },
        { status: 404 }
      );
    }

    // Verify distributor exists and is active
    const distributor = await prisma.distributor.findFirst({
      where: { id: distributorId },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    if (!distributor.active) {
      return NextResponse.json(
        { error: 'Cannot add mapping to inactive distributor' },
        { status: 400 }
      );
    }

    // Check for duplicate mapping
    const existing = await prisma.supplierItemMapping.findFirst({
      where: {
        warehouseItemId,
        distributorId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            'A mapping already exists for this item and distributor combination',
        },
        { status: 409 }
      );
    }

    // If this is set as preferred, unset other preferred suppliers for this item
    if (preferredSupplier) {
      await prisma.supplierItemMapping.updateMany({
        where: {
          warehouseItemId,
          preferredSupplier: true,
        },
        data: {
          preferredSupplier: false,
        },
      });
    }

    // Create mapping
    const mapping = await prisma.supplierItemMapping.create({
      data: {
        companyId,
        warehouseItemId,
        distributorId,
        supplierSKU: supplierSKU?.trim() || null,
        packSize: packSize ? parseInt(packSize, 10) : 1,
        unitCost: parseFloat(unitCost),
        moq: moq ? parseInt(moq, 10) : 1,
        preferredSupplier: preferredSupplier || false,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : null,
        notes: notes?.trim() || null,
        active: true,
      },
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

    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create supplier mapping' },
      { status: 500 }
    );
  }
}
