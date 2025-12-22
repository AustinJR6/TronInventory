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

/**
 * Normalize search terms for better matching
 * Converts common variations to standardized forms
 */
const normalizeSearchTerm = (term: string): string[] => {
  const normalized = term.toLowerCase().trim();
  const variations: string[] = [normalized];

  // Extract key components for broader matching
  const components: string[] = [];

  // Handle wire gauge variations (#4, number 4, no 4, etc.)
  const wireGaugeMatch = normalized.match(/(?:number|no\.?|#)\s*(\d+)/);
  if (wireGaugeMatch) {
    const gauge = wireGaugeMatch[1];
    variations.push(`#${gauge}`);
    variations.push(`${gauge} awg`);
    variations.push(`number ${gauge}`);
    components.push(gauge); // Just the number
  }

  // Handle conduit sizes (3/4, 3/4", three quarter, etc.)
  const fractionMatch = normalized.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const frac = `${fractionMatch[1]}/${fractionMatch[2]}`;
    variations.push(frac);
    variations.push(`${frac}"`);
    variations.push(`${frac}" `);
    components.push(frac); // Just the fraction
  }

  // Extract product type keywords
  if (normalized.includes('emt')) {
    variations.push('emt conduit', 'electrical metallic tubing', 'emt');
    components.push('emt');
  }
  if (normalized.includes('pvc')) {
    variations.push('pvc conduit', 'pvc');
    components.push('pvc');
  }
  if (normalized.includes('mc')) {
    variations.push('mc cable', 'metal clad', 'mc');
    components.push('mc');
  }
  if (normalized.includes('romex')) {
    variations.push('nm cable', 'non-metallic', 'romex');
    components.push('romex');
  }
  if (normalized.includes('thhn') || normalized.includes('thwn')) {
    variations.push('thhn', 'thwn', 'thhn wire', 'thwn wire');
    components.push('thhn');
  }
  if (normalized.includes('wire') || normalized.includes('cable')) {
    variations.push('wire', 'cable', 'conductor');
  }
  if (normalized.includes('conduit')) {
    variations.push('conduit');
    components.push('conduit');
  }

  // Add component combinations for items like "3/4 emt"
  if (components.length >= 2) {
    // For "3/4 emt", also try just "3/4" and just "emt"
    components.forEach(comp => variations.push(comp));
  }

  return [...new Set(variations)]; // Remove duplicates
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
        const searchTerm = args.itemName || '';

        // Generate search variations
        const searchVariations = normalizeSearchTerm(searchTerm);

        // Search with OR conditions for all variations
        const items = await prisma.warehouseInventory.findMany({
          where: {
            AND: [
              { branchId: branchFilter ?? undefined },
              {
                OR: searchVariations.map((variation: string) => ({
                  itemName: { contains: variation, mode: 'insensitive' }
                }))
              }
            ]
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

        // If no results with variations, try individual keywords
        if (items.length === 0) {
          const keywords = searchTerm.toLowerCase().split(/\s+/).filter((k: string) => k.length > 2);
          const keywordItems = await prisma.warehouseInventory.findMany({
            where: {
              AND: [
                { branchId: branchFilter ?? undefined },
                {
                  OR: keywords.map((keyword: string) => ({
                    itemName: { contains: keyword, mode: 'insensitive' }
                  }))
                }
              ]
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

          return { success: true, data: { items: keywordItems, searchedFor: searchTerm } };
        }

        return { success: true, data: { items, searchedFor: searchTerm } };
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
