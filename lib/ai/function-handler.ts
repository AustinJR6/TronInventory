import { createHash } from 'crypto';
import { AI_FUNCTIONS } from './function-definitions';
import { withCompanyScope } from '../prisma-middleware';
import { executeAiFunction } from './function-executors';
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

// Read-only functions that don't need user confirmation
const READ_ONLY_FUNCTIONS = [
  'check_inventory',
  'get_inventory_details',
  'get_my_orders',
  'search_orders',
];

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
  const proposedActions = [];
  const executedActions = [];

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

    // Check if this is a read-only function
    const isReadOnly = READ_ONLY_FUNCTIONS.includes(fnName);

    if (isReadOnly) {
      // Execute read-only functions immediately without confirmation
      const executionResult = await executeAiFunction(fnName, parsedArgs, {
        userId: context.userId,
        companyId: context.companyId,
        branchId: context.branchId,
        userRole: context.userRole,
      });

      const action = await prisma.aiAction.create({
        data: {
          conversationId: context.conversationId,
          companyId: context.companyId,
          userId: context.userId,
          actionType: fnName,
          status: executionResult.success ? 'EXECUTED' : 'FAILED',
          proposedData: JSON.stringify(parsedArgs),
          executedData: executionResult.success
            ? JSON.stringify(executionResult.data ?? {})
            : null,
          errorMessage: executionResult.success ? null : executionResult.error,
          idempotencyKey,
          confirmedAt: new Date(),
          executedAt: new Date(),
        },
      });

      executedActions.push(action);
    } else {
      // Propose write operations for user confirmation
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

      proposedActions.push(action);
    }
  }

  return { proposedActions, executedActions };
}
