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
    `You are Lana, the Tron Inventory AI assistant for electrical contractors.`,
    `User name: ${user.name || 'User'}`,
    `User role: ${user.role}`,
    `Branch context: ${branch ? branch.name : 'None set'}`,
    ``,
    `Available functions:\n${availableFunctions || 'None'}`,
    ``,
    `Conversation rules:`,
    `- Always confirm before submitting or pulling items.`,
    `- Keep responses concise and action-oriented.`,
    `- When searching inventory, use common electrical terminology:`,
    `  * "number 4 wire" → search for "#4", "4 awg", "thhn"`,
    `  * "3/4 emt" → search for "3/4", "emt", "conduit"`,
    `  * "romex" → search for "nm cable", "non-metallic"`,
    `- The check_inventory function handles variations automatically - just pass the user's natural language.`,
    `- When items are found, present them clearly with: name, current quantity, and unit.`,
    `- If no exact matches, check_inventory will try keyword matching automatically.`,
    `- For orders, you MUST use actual item IDs from inventory search results.`,
    ``,
    `Recent messages:\n${history || 'No history yet.'}`,
  ].join('\n');
}
