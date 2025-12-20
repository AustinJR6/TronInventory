import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

/**
 * GET /api/part-requests
 * Get part requests (filtered by role)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, role, userId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Field workers only see their own requests
    // Admin/Warehouse see all requests
    const where: any = {};
    if (role === 'FIELD') {
      where.requestedBy = userId;
    }
    if (status) {
      where.status = status;
    }

    const partRequests = await scopedPrisma.partRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ partRequests });
  } catch (error: any) {
    console.error('Error fetching part requests:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}

/**
 * POST /api/part-requests
 * Create a new part request (any authenticated user)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { itemName, description, quantity, urgency } = body;

    if (!itemName) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    const partRequest = await scopedPrisma.partRequest.create({
      data: {
        requestedBy: userId,
        itemName,
        description: description || null,
        quantity: quantity || 1,
        urgency: urgency || 'normal',
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      partRequest,
      message: 'Part request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating part request:', error);
    const status = error.message?.includes('required') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}

/**
 * PATCH /api/part-requests
 * Update a part request (status, notes, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId, role, userId } = await enforceAll(session, {
      role: ['ADMIN', 'WAREHOUSE'],
    });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { requestId, status, notes } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'FULFILLED') {
        updateData.fulfilledBy = userId;
        updateData.fulfilledAt = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const updatedRequest = await scopedPrisma.partRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            vehicleNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      partRequest: updatedRequest,
      message: 'Part request updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating part request:', error);
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
