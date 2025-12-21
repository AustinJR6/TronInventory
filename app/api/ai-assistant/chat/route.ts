import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { buildConversationContext } from '@/lib/ai/context-builder';
import { handleFunctionCalls } from '@/lib/ai/function-handler';
import { AI_FUNCTIONS } from '@/lib/ai/function-definitions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, companyId, userRole } = await enforceAll(session, {
      allowReadOnly: true,
    });

    const prisma = withCompanyScope(companyId);
    const body = await request.json();
    const { conversationId, message, topic } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const branchId = session?.user?.branchId ?? null;
    let conversation =
      conversationId &&
      (await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      }));

    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          companyId,
          userId,
          branchId,
          topic: topic || 'general',
          status: 'ACTIVE',
        },
      });
    }

    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const contextPreview = buildConversationContext(
      { name: session?.user?.name || 'User', role: userRole as any },
      null,
      recentMessages
    );

    // Phase 1 stub: respond with a canned message and list available tools
    const toolList = Object.values(AI_FUNCTIONS)
      .filter((fn) => fn.requiredRoles.includes(userRole as any))
      .map((fn) => fn.name)
      .join(', ');

    const aiResponse =
      toolList.length > 0
        ? `Hi, I'm Lana. I can help with inventory and orders. Tools available: ${toolList}. What would you like to do next?`
        : `Hi, I'm Lana. Tell me how I can help with your inventory.`;

    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse,
        toolCalls: null,
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: 'ACTIVE',
      },
    });

    // No real function calls yet; stubbing for Phase 1
    const proposedActions = await handleFunctionCalls([], {
      userId,
      companyId,
      branchId,
      userRole: userRole as any,
      conversationId: conversation.id,
    });

    return NextResponse.json({
      conversationId: conversation.id,
      aiResponse,
      proposedActions,
      requiresConfirmation: proposedActions.length > 0,
      assistantMessage,
      contextPreview,
    });
  } catch (error: any) {
    console.error('AI assistant chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    );
  }
}
