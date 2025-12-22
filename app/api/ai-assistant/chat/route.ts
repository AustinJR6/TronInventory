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
    let proposedActions: any[] = [];
    let executedActions: any[] = [];

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

      // First API call - AI decides what functions to call
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
      toolCalls = choice.message.tool_calls || null;

      // Execute the function calls
      const functionResults = await handleFunctionCalls(toolCalls || [], {
        userId,
        companyId,
        branchId,
        userRole: userRole as any,
        conversationId: conversation.id,
      });

      proposedActions = functionResults.proposedActions;
      executedActions = functionResults.executedActions;

      // If there were function calls, do a second API call with the results
      if (toolCalls && toolCalls.length > 0) {
        const messagesWithResults = [
          ...messagesForOpenAI,
          {
            role: 'assistant',
            content: choice.message.content,
            tool_calls: toolCalls,
          },
          // Add the function results
          ...toolCalls.map((toolCall: any) => {
            const fnName = toolCall.function.name;
            // Find the corresponding executed or proposed action
            const action = [...executedActions, ...proposedActions].find(
              (a: any) => a.actionType === fnName
            );

            let result;
            if (action?.executedData) {
              // Read-only function that was executed
              result = JSON.parse(action.executedData);
            } else if (action?.status === 'PROPOSED') {
              // Write function that needs confirmation
              result = {
                status: 'pending_confirmation',
                message: 'Action proposed and awaiting user confirmation',
              };
            } else {
              result = { error: 'Function execution failed' };
            }

            return {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            };
          }),
        ];

        // Second API call - AI responds based on function results
        const finalCompletion = await openai.chat.completions.create({
          model: AI_MODELS.chat,
          temperature: AI_DEFAULTS.temperature,
          max_tokens: AI_DEFAULTS.maxTokens,
          messages: messagesWithResults as any,
        });

        aiResponse = finalCompletion.choices[0].message.content || aiResponse;
      } else {
        // No function calls, use the original response
        aiResponse = choice.message.content || aiResponse;
      }
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
