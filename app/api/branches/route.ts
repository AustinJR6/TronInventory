import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import { prisma } from '@/lib/prisma';

// Tier-based branch limits
const BRANCH_LIMITS = {
  CORE: 1,
  OPS: 5,
  OPS_SCAN: 10,
  OPS_SCAN_PO: 999, // Unlimited
};

/**
 * GET /api/branches
 * Get all branches for the company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication and get scoped context
    const { companyId } = await enforceAll(session);

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    // All queries automatically filtered by companyId
    const branches = await scopedPrisma.branch.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        active: true,
        createdAt: true,
      },
    });

    // Get license info for tier limits
    const license = await prisma.license.findUnique({
      where: { companyId },
      select: { tier: true },
    });

    const branchLimit = license ? BRANCH_LIMITS[license.tier] : BRANCH_LIMITS.CORE;

    return NextResponse.json({
      branches,
      branchLimit,
      currentCount: branches.length,
      canAddMore: branches.length < branchLimit,
    });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

/**
 * POST /api/branches
 * Create a new branch (ADMIN only)
 * Optional: duplicate inventory from another branch
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce ADMIN role
    const { companyId } = await enforceAll(session, { role: 'ADMIN' });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { name, city, address, duplicateFromBranchId } = body;

    if (!name || !city) {
      return NextResponse.json(
        { error: 'Name and city are required' },
        { status: 400 }
      );
    }

    // Check branch limit
    const [existingBranches, license] = await Promise.all([
      scopedPrisma.branch.count({ where: { active: true } }),
      prisma.license.findUnique({
        where: { companyId },
        select: { tier: true, status: true },
      }),
    ]);

    if (!license) {
      return NextResponse.json(
        { error: 'No license found for your company' },
        { status: 403 }
      );
    }

    const branchLimit = BRANCH_LIMITS[license.tier];
    if (existingBranches >= branchLimit) {
      return NextResponse.json(
        {
          error: `Branch limit reached. Your ${license.tier} tier allows ${branchLimit} branch${branchLimit === 1 ? '' : 'es'}. Upgrade your license to add more branches.`,
          branchLimit,
          currentCount: existingBranches,
        },
        { status: 403 }
      );
    }

    // Create the branch
    const newBranch = await scopedPrisma.branch.create({
      data: {
        name,
        city,
        address: address || null,
        active: true,
      },
    });

    // Duplicate inventory if requested
    if (duplicateFromBranchId) {
      const sourceInventory = await scopedPrisma.warehouseInventory.findMany({
        where: { branchId: duplicateFromBranchId },
        select: {
          itemName: true,
          category: true,
          parLevel: true,
          unit: true,
        },
      });

      if (sourceInventory.length > 0) {
        await scopedPrisma.warehouseInventory.createMany({
          data: sourceInventory.map(item => ({
            ...item,
            branchId: newBranch.id,
            currentQty: 0, // Start with 0 quantity for new branch
          })),
        });
      }
    }

    return NextResponse.json({
      branch: newBranch,
      message: 'Branch created successfully',
      duplicatedItems: duplicateFromBranchId ? true : false,
    });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    const status = error.message?.includes('required')
      ? 401
      : error.message?.includes('Access denied')
      ? 403
      : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}

/**
 * PATCH /api/branches
 * Update a branch (ADMIN only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce ADMIN role
    const { companyId } = await enforceAll(session, { role: 'ADMIN' });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { branchId, name, city, address, active } = body;

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (active !== undefined) updateData.active = active;

    const updatedBranch = await scopedPrisma.branch.update({
      where: { id: branchId },
      data: updateData,
    });

    return NextResponse.json({
      branch: updatedBranch,
      message: 'Branch updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    const status = error.message?.includes('required')
      ? 401
      : error.message?.includes('Access denied')
      ? 403
      : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}
