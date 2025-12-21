import { UserRole } from '@prisma/client';
import { AI_FUNCTIONS } from './function-definitions';
import { withCompanyScope } from '../prisma-middleware';

type ExecutionContext = {
  userId: string;
  companyId: string;
  branchId: string | null;
  userRole: UserRole;
};

export async function executeAiFunction(
  functionName: string,
  args: any,
  context: ExecutionContext
): Promise<{ success: boolean; data?: any; error?: string }> {
  const definition = AI_FUNCTIONS[functionName];

  if (!definition) {
    return { success: false, error: `Unknown function: ${functionName}` };
  }

  if (!definition.requiredRoles.includes(context.userRole)) {
    return { success: false, error: 'Access denied for this function' };
  }

  // Tenant scoped client
  const prisma = withCompanyScope(context.companyId);

  try {
    switch (functionName) {
      case 'check_inventory': {
        const branchFilter = args.branchId ?? context.branchId;
        const items = await prisma.warehouseInventory.findMany({
          where: {
            itemName: { contains: args.itemName, mode: 'insensitive' },
            branchId: branchFilter ?? undefined,
          },
          select: {
            id: true,
            itemName: true,
            category: true,
            unit: true,
            currentQty: true,
            parLevel: true,
            branchId: true,
          },
          take: 20,
        });

        return { success: true, data: { items } };
      }
      case 'get_my_orders': {
        const orders = await prisma.order.findMany({
          where: { userId: context.userId },
          orderBy: { createdAt: 'desc' },
          take: args.limit && Number.isInteger(args.limit) ? args.limit : 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            branchId: true,
          },
        });
        return { success: true, data: { orders } };
      }
      default:
        // Phase 1: stubbed responses for write operations
        return {
          success: true,
          data: {
            message:
              'Function acknowledged in stub mode. No write operation was executed.',
            requested: { functionName, args },
          },
        };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Execution failed' };
  }
}
