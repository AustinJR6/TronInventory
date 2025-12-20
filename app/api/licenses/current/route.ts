import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/licenses/current
 * Get the current user's company license
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { companyId } = await enforceAll(session);

    const license = await prisma.license.findUnique({
      where: { companyId },
      select: {
        tier: true,
        status: true,
        expiresAt: true,
        startsAt: true,
        notes: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'No license found' },
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
