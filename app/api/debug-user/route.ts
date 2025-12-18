import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'raustinj39@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        // Don't select password for security
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to query user', details: error.message },
      { status: 500 }
    );
  }
}
