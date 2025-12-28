import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

/**
 * GET /api/thresholds
 * List inventory thresholds
 * Query params:
 *  - branchId: Filter by branch (optional, shows all if not provided)
 *  - belowMin: Show only items below minimum level
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
    const branchId = searchParams.get('branchId');
    const belowMin = searchParams.get('belowMin') === 'true';

    // Build where clause
    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }

    // Fetch thresholds with related data
    const thresholds = await prisma.inventoryThreshold.findMany({
      where,
      include: {
        warehouseItem: {
          select: {
            id: true,
            itemName: true,
            category: true,
            unit: true,
            currentQty: true,
            parLevel: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { warehouseItem: { itemName: 'asc' } },
      ],
    });

    // Filter by below minimum if requested
    let filteredThresholds = thresholds;
    if (belowMin) {
      filteredThresholds = thresholds.filter(
        (t: typeof thresholds[0]) => t.warehouseItem.currentQty < t.minLevel
      );
    }

    // Calculate status for each threshold
    const thresholdsWithStatus = filteredThresholds.map((threshold: typeof thresholds[0]) => {
      const currentQty = threshold.warehouseItem.currentQty;
      let status = 'OK';

      if (currentQty <= threshold.criticalLevel) {
        status = 'CRITICAL';
      } else if (currentQty < threshold.minLevel) {
        status = 'BELOW_MIN';
      } else if (currentQty < threshold.parLevel) {
        status = 'BELOW_PAR';
      }

      return {
        ...threshold,
        status,
      };
    });

    return NextResponse.json({ thresholds: thresholdsWithStatus });
  } catch (error: any) {
    console.error('Error fetching thresholds:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch thresholds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/thresholds
 * Create or update (upsert) an inventory threshold
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
      branchId,
      minLevel,
      parLevel,
      criticalLevel,
      reorderQty,
    } = body;

    // Validate required fields
    if (!warehouseItemId) {
      return NextResponse.json(
        { error: 'Warehouse item ID is required' },
        { status: 400 }
      );
    }

    if (parLevel === undefined || parLevel === null) {
      return NextResponse.json(
        { error: 'Par level is required' },
        { status: 400 }
      );
    }

    // Validate threshold logic: critical < min < par
    const parsedMinLevel = minLevel !== undefined ? parseInt(minLevel, 10) : 0;
    const parsedParLevel = parseInt(parLevel, 10);
    const parsedCriticalLevel = criticalLevel !== undefined ? parseInt(criticalLevel, 10) : 0;

    if (parsedCriticalLevel >= parsedMinLevel) {
      return NextResponse.json(
        { error: 'Critical level must be less than minimum level' },
        { status: 400 }
      );
    }

    if (parsedMinLevel >= parsedParLevel) {
      return NextResponse.json(
        { error: 'Minimum level must be less than par level' },
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

    // If branchId is provided, verify it exists
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId },
      });

      if (!branch) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }
    }

    // Upsert threshold
    const threshold = await prisma.inventoryThreshold.upsert({
      where: {
        companyId_warehouseItemId_branchId: {
          companyId,
          warehouseItemId,
          branchId: branchId || null,
        },
      },
      create: {
        companyId,
        warehouseItemId,
        branchId: branchId || null,
        minLevel: parsedMinLevel,
        parLevel: parsedParLevel,
        criticalLevel: parsedCriticalLevel,
        reorderQty: reorderQty ? parseInt(reorderQty, 10) : null,
      },
      update: {
        minLevel: parsedMinLevel,
        parLevel: parsedParLevel,
        criticalLevel: parsedCriticalLevel,
        reorderQty: reorderQty ? parseInt(reorderQty, 10) : null,
      },
      include: {
        warehouseItem: {
          select: {
            id: true,
            itemName: true,
            category: true,
            unit: true,
            currentQty: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ threshold }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/updating threshold:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/update threshold' },
      { status: 500 }
    );
  }
}
