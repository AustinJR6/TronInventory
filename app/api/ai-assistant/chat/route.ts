import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { buildConversationContext } from '@/lib/ai/context-builder';
import { handleFunctionCalls } from '@/lib/ai/function-handler';
import { AI_FUNCTIONS } from '@/lib/ai/function-definitions';
import { openai, AI_MODELS, AI_DEFAULTS } from '@/lib/ai/openai-client';

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
    const branch =
      branchId &&
      (await prisma.branch.findFirst({
        where: { id: branchId },
      }));

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

    const context = buildConversationContext(
      { name: session?.user?.name || 'User', role: userRole as any },
      branch || null,
      recentMessages
    );

    const allowedFunctions = Object.values(AI_FUNCTIONS).filter((fn) =>
      fn.requiredRoles.includes(userRole as any)
    );

    let aiResponse =
      `Hi, I'm Lana. I can help with inventory and orders. What would you like to do next?`;
    let toolCalls: any[] | null = null;

    if (process.env.OPENAI_API_KEY) {
      const messagesForOpenAI = [
        { role: 'system', content: context },
        ...recentMessages.map(
          (m: { role: string; content: string }) => ({
            role: m.role === 'USER' ? 'user' : 'assistant',
            content: m.content,
          })
        ),
      ];

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.chat,
        temperature: AI_DEFAULTS.temperature,
        max_tokens: AI_DEFAULTS.maxTokens,
        messages: messagesForOpenAI,
        tools: allowedFunctions.map((fn) => ({
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters as any,
          },
        })),
        tool_choice: 'auto',
      });

      const choice = completion.choices[0];
      aiResponse = choice.message.content || aiResponse;
      toolCalls = choice.message.tool_calls || null;
    }

    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse,
        toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: 'ACTIVE',
      },
    });

    const { proposedActions, executedActions } = await handleFunctionCalls(toolCalls || [], {
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
      executedActions,
      requiresConfirmation: proposedActions.length > 0,
      assistantMessage,
      topic: conversation.topic,
    });
  } catch (error: any) {
    console.error('AI assistant chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    );
  }
}
