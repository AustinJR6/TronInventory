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

    const user = await scopedPrisma.user.findFirst({
      where: { email: 'raustinj39@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        // Don't select password for security
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in your company' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to query user', details: error.message },
      { status }
    );
  }
}
