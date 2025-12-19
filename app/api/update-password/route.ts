import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication and get scoped context
    const { companyId, userId } = await enforceAll(session);

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Get user from database (scoped to company)
    const user = await scopedPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password (scoped to company)
    await scopedPrisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error updating password:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json({
      error: error.message || 'Internal server error',
      details: error.message
    }, { status });
  }
}
