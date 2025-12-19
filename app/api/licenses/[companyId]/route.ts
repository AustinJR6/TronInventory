import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';

/**
 * GET /api/licenses/[companyId]
 * Get license details for a company
 * Users can only access their own company's license
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication
    const { companyId } = await enforceAll(session);

    // Validate user can only access their own company's license
    if (params.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own company license.' },
        { status: 403 }
      );
    }

    // Query using authenticated user's companyId
    const license = await prisma.license.findUnique({
      where: { companyId: companyId },
      select: {
        id: true,
        companyId: true,
        status: true,
        tier: true,
        startsAt: true,
        expiresAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'No license found for this company' },
        { status: 404 }
      );
    }

    return NextResponse.json({ license });
  } catch (error: any) {
    console.error('Error fetching license:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}
