import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

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
    });

    return NextResponse.json({ branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}
