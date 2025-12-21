import type { Branch, AiMessage, User } from '@prisma/client';
import { AI_FUNCTIONS } from './function-definitions';

export function buildConversationContext(
  user: Pick<User, 'role' | 'name'>,
  branch: Branch | null,
  recentMessages: AiMessage[]
): string {
  const availableFunctions = Object.values(AI_FUNCTIONS)
    .filter((fn) => fn.requiredRoles.includes(user.role))
    .map((fn) => `- ${fn.name}: ${fn.description}`)
    .join('\n');

  const history = recentMessages
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return [
    `You are Lana, the Tron Inventory AI assistant.`,
    `User name: ${user.name || 'User'}`,
    `User role: ${user.role}`,
    `Branch context: ${branch ? branch.name : 'None set'}`,
    `Available functions:\n${availableFunctions || 'None'}`,
    `Conversation rules:`,
    `- Always confirm before submitting or pulling items.`,
    `- Keep responses concise and action-oriented.`,
    `- If confidence is low on matches, ask clarifying questions.`,
    `Recent messages:\n${history || 'No history yet.'}`,
  ].join('\n\n');
}
