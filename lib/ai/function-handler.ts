import { createHash } from 'crypto';
import { AI_FUNCTIONS } from './function-definitions';
import { withCompanyScope } from '../prisma-middleware';
import type { UserRole } from '@prisma/client';

type FunctionCall =
  | { name: string; arguments: string }
  | { function: { name: string; arguments: string } };
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
    const fnName = 'function' in call ? call.function.name : call.name;
    const fnArgs = 'function' in call ? call.function.arguments : call.arguments;

    const definition = AI_FUNCTIONS[fnName];
    if (!definition) {
      continue;
    }

    if (!definition.requiredRoles.includes(context.userRole)) {
      continue;
    }

    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(fnArgs || '{}');
    } catch {
      parsedArgs = {};
    }

    const idempotencyKey = buildIdempotencyKey(
      context.userId,
      fnName,
      parsedArgs
    );

    const action = await prisma.aiAction.create({
      data: {
        conversationId: context.conversationId,
        companyId: context.companyId,
        userId: context.userId,
        actionType: fnName,
        status: 'PROPOSED',
        proposedData: JSON.stringify(parsedArgs),
        idempotencyKey,
      },
    });

    actions.push(action);
  }

  return actions;
}
