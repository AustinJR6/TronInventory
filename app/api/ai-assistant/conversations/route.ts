import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, companyId } = await enforceAll(session, {
      allowReadOnly: true,
    });
    const prisma = withCompanyScope(companyId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const conversations = await prisma.aiConversation.findMany({
      where: {
        userId,
        status: status || undefined,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { messages: true, actions: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load conversations' },
      { status: 500 }
    );
  }
}
