import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

/**
 * GET /api/distributors
 * List all distributors for the company
 * Required roles: ADMIN, WAREHOUSE
 * License: OPS_SCAN_PO tier
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
      feature: 'purchaseOrders', // Enforces OPS_SCAN_PO tier
    });

    const prisma = withCompanyScope(companyId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Build where clause
    const where: any = {};
    if (activeOnly) {
      where.active = true;
    }

    // Fetch distributors with item mapping count
    const distributors = await prisma.distributor.findMany({
      where,
      include: {
        _count: {
          select: {
            itemMappings: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ distributors });
  } catch (error: any) {
    console.error('Error fetching distributors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch distributors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/distributors
 * Create a new distributor
 * Required roles: ADMIN
 * License: OPS_SCAN_PO tier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
      feature: 'purchaseOrders', // Enforces OPS_SCAN_PO tier
    });

    const prisma = withCompanyScope(companyId);
    const body = await request.json();

    const {
      name,
      contactName,
      email,
      phone,
      website,
      orderingMethod,
      defaultLeadDays,
      notes,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Distributor name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name within company
    const existing = await prisma.distributor.findFirst({
      where: {
        name: name.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A distributor with this name already exists' },
        { status: 409 }
      );
    }

    // Create distributor
    const distributor = await prisma.distributor.create({
      data: {
        companyId,
        name: name.trim(),
        contactName: contactName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        orderingMethod: orderingMethod?.trim() || null,
        defaultLeadDays: defaultLeadDays ? parseInt(defaultLeadDays, 10) : 0,
        notes: notes?.trim() || null,
        active: true,
      },
      include: {
        _count: {
          select: {
            itemMappings: true,
            purchaseOrders: true,
          },
        },
      },
    });

    return NextResponse.json({ distributor }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating distributor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create distributor' },
      { status: 500 }
    );
  }
}
