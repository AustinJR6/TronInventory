import { createHash } from 'crypto';
import { AI_FUNCTIONS } from './function-definitions';
import { withCompanyScope } from '../prisma-middleware';
import type { UserRole } from '@prisma/client';

type FunctionCall = { name: string; arguments: string };
type UserContext = {
  userId: string;
  companyId: string;
  branchId: string | null;
  userRole: UserRole;
  conversationId: string;
};

const buildIdempotencyKey = (
  userId: string,
  functionName: string,
  args: any
) => {
  const hash = createHash('sha256')
    .update(JSON.stringify({ userId, functionName, args }))
    .digest('hex')
    .slice(0, 16);
  return `${userId}-${functionName}-${hash}`;
};

export async function handleFunctionCalls(
  functionCalls: FunctionCall[],
  context: UserContext
) {
  const prisma = withCompanyScope(context.companyId);
  const actions = [];

  for (const call of functionCalls) {
    const definition = AI_FUNCTIONS[call.name];
    if (!definition) {
      continue;
    }

    if (!definition.requiredRoles.includes(context.userRole)) {
      continue;
    }

    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(call.arguments || '{}');
    } catch {
      parsedArgs = {};
    }

    const idempotencyKey = buildIdempotencyKey(
      context.userId,
      call.name,
      parsedArgs
    );

    const action = await prisma.aiAction.create({
      data: {
        conversationId: context.conversationId,
        companyId: context.companyId,
        userId: context.userId,
        actionType: call.name,
        status: 'PROPOSED',
        proposedData: JSON.stringify(parsedArgs),
        idempotencyKey,
      },
    });

    actions.push(action);
  }

  return actions;
}
