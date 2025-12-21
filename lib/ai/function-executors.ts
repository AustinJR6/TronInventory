import { UserRole } from '@prisma/client';
import { AI_FUNCTIONS } from './function-definitions';
import { withCompanyScope } from '../prisma-middleware';

type ExecutionContext = {
  userId: string;
  companyId: string;
  branchId: string | null;
  userRole: UserRole;
};

const ensureRole = (functionName: string, role: UserRole, required: UserRole[]) => {
  if (!required.includes(role)) {
    throw new Error('Access denied for this function');
  }
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

  try {
    ensureRole(functionName, context.userRole, definition.requiredRoles);
    const prisma = withCompanyScope(context.companyId);

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

      case 'get_inventory_details': {
        const branchFilter = args.branchId ?? context.branchId;
        const items = await prisma.warehouseInventory.findMany({
          where: {
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
          orderBy: { currentQty: 'asc' },
          take: 50,
        });
        const filtered = args.belowParOnly
          ? items.filter(
              (i: { currentQty: number; parLevel: number }) =>
                i.currentQty < i.parLevel
            )
          : items;
        return { success: true, data: { items: filtered } };
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

      case 'search_orders': {
        const where: any = {};
        if (context.userRole === 'FIELD') {
          where.userId = context.userId;
        }
        if (args.status) {
          where.status = args.status;
        }
        if (args.query) {
          where.orderNumber = { contains: args.query, mode: 'insensitive' };
        }
        const orders = await prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
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

      case 'create_order': {
        if (!Array.isArray(args.items) || args.items.length === 0) {
          throw new Error('Items are required to create an order');
        }

        const orderCount = await prisma.order.count();
        const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

        const order = await prisma.order.create({
          data: {
            orderNumber,
            userId: context.userId,
            vehicleNumber: 'AI-ORDER',
            orderType: args.orderType || 'AD_HOC',
            notes: args.notes || null,
            branchId: args.branchId ?? context.branchId,
            items: {
              create: args.items.map((item: any) => ({
                warehouseItemId: item.itemId,
                requestedQty: item.quantity,
              })),
            },
          },
          include: {
            items: {
              include: { warehouseItem: true },
            },
          },
        });

        return { success: true, data: { order } };
      }

      case 'pull_order_items': {
        if (!Array.isArray(args.pulledItems) || !args.orderId) {
          throw new Error('orderId and pulledItems are required');
        }

        const order = await prisma.order.findUnique({
          where: { id: args.orderId },
          include: { items: true },
        });

        if (!order) throw new Error('Order not found');

        for (const item of args.pulledItems as Array<{ itemId: string; qty: number }>) {
          const orderItem = order.items.find(
            (i: { id: string; warehouseItemId: string }) => i.id === item.itemId
          );
          if (!orderItem) continue;

          await prisma.orderItem.update({
            where: { id: orderItem.id },
            data: { pulledQty: item.qty },
          });

          await prisma.warehouseInventory.update({
            where: { id: orderItem.warehouseItemId },
            data: { currentQty: { decrement: item.qty } },
          });
        }

        const updated = await prisma.order.update({
          where: { id: args.orderId },
          data: { status: 'IN_PROGRESS' },
          include: {
            items: { include: { warehouseItem: true } },
          },
        });

        return { success: true, data: { order: updated } };
      }

      case 'request_branch_transfer': {
        if (!args.fromBranch || !args.toBranch || !args.itemId || !args.quantity) {
          throw new Error('fromBranch, toBranch, itemId, and quantity are required');
        }

        const item = await prisma.warehouseInventory.findUnique({
          where: { id: args.itemId },
          select: { itemName: true },
        });

        const transfer = await prisma.partRequest.create({
          data: {
            companyId: context.companyId,
            requestedBy: context.userId,
            itemName: item?.itemName || 'Requested item',
            description: `Transfer from ${args.fromBranch} to ${args.toBranch}`,
            quantity: args.quantity,
            status: 'PENDING',
            notes: args.notes || null,
          },
        });

        return { success: true, data: { transfer } };
      }

      case 'update_inventory': {
        if (!args.itemId || typeof args.delta !== 'number') {
          throw new Error('itemId and delta are required');
        }

        const updated = await prisma.warehouseInventory.update({
          where: { id: args.itemId },
          data: { currentQty: { increment: args.delta } },
        });

        await prisma.inventoryTransaction.create({
          data: {
            companyId: context.companyId,
            itemId: args.itemId,
            delta: args.delta,
            reason: args.reason || 'AI adjustment',
            source: 'ai',
            createdBy: context.userId,
          },
        });

        return { success: true, data: { item: updated } };
      }

      default:
        return { success: false, error: 'Function not implemented' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Execution failed' };
  }
}
