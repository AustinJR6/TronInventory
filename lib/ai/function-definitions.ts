import { UserRole } from '@prisma/client';

export interface AiFunctionDefinition {
  name: string;
  description: string;
  parameters: object;
  requiredRoles: UserRole[];
}

export const AI_FUNCTIONS: Record<string, AiFunctionDefinition> = {
  // Field worker functions
  check_inventory: {
    name: 'check_inventory',
    description: 'Searches warehouse inventory for matching items and returns quantities',
    parameters: {
      type: 'object',
      properties: {
        itemName: { type: 'string' },
        branchId: { type: 'string', nullable: true },
      },
      required: ['itemName'],
    },
    requiredRoles: [UserRole.FIELD, UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  create_order: {
    name: 'create_order',
    description: 'Creates a draft order for confirmation',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              quantity: { type: 'integer' },
            },
            required: ['itemId', 'quantity'],
          },
        },
        orderType: { type: 'string' },
        notes: { type: 'string', nullable: true },
      },
      required: ['items', 'orderType'],
    },
    requiredRoles: [UserRole.FIELD, UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  get_my_orders: {
    name: 'get_my_orders',
    description: 'Returns a summary of the user’s recent orders',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', nullable: true },
      },
    },
    requiredRoles: [UserRole.FIELD, UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  // Warehouse/Admin functions
  pull_order_items: {
    name: 'pull_order_items',
    description: 'Marks order items as pulled for fulfillment',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        pulledItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              qty: { type: 'integer' },
            },
            required: ['itemId', 'qty'],
          },
        },
      },
      required: ['orderId', 'pulledItems'],
    },
    requiredRoles: [UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  request_branch_transfer: {
    name: 'request_branch_transfer',
    description: 'Creates a pending branch transfer request',
    parameters: {
      type: 'object',
      properties: {
        fromBranch: { type: 'string' },
        toBranch: { type: 'string' },
        itemId: { type: 'string' },
        quantity: { type: 'integer' },
      },
      required: ['fromBranch', 'toBranch', 'itemId', 'quantity'],
    },
    requiredRoles: [UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  update_inventory: {
    name: 'update_inventory',
    description: 'Adjusts inventory quantities',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        delta: { type: 'integer' },
        reason: { type: 'string', nullable: true },
      },
      required: ['itemId', 'delta'],
    },
    requiredRoles: [UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  search_orders: {
    name: 'search_orders',
    description: 'Searches orders by number or status',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        status: { type: 'string', nullable: true },
      },
      required: ['query'],
    },
    requiredRoles: [UserRole.WAREHOUSE, UserRole.ADMIN],
  },
  get_inventory_details: {
    name: 'get_inventory_details',
    description: 'Returns inventory below par level or matching filters',
    parameters: {
      type: 'object',
      properties: {
        belowParOnly: { type: 'boolean', nullable: true },
        branchId: { type: 'string', nullable: true },
      },
    },
    requiredRoles: [UserRole.FIELD, UserRole.WAREHOUSE, UserRole.ADMIN],
  },
};
