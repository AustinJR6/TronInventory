import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, companyId } = await enforceAll(session);
    const prisma = withCompanyScope(companyId);

    const conversation = await prisma.aiConversation.findFirst({
      where: { id: params.id, userId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const archived = await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    return NextResponse.json({ conversation: archived });
  } catch (error: any) {
    console.error('Archive conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}
