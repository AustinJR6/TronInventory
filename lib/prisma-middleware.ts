import { Prisma } from '@prisma/client';

/**
 * Prisma middleware for automatic company scoping
 *
 * This middleware automatically injects companyId filters on all tenant-scoped models
 * to ensure multi-tenant data isolation.
 *
 * IMPORTANT: This works in conjunction with Supabase RLS policies for defense-in-depth.
 */

// Models that require company scoping
const TENANT_MODELS = [
  'user',
  'branch',
  'warehouseInventory',
  'vehicleInventoryItem',
  'vehicleStock',
  'order',
  'inventoryTransaction',
];

/**
 * Creates a middleware function that scopes queries by companyId
 * @param companyId - The company ID to scope queries to
 */
export function createCompanyScopingMiddleware(companyId: string): Prisma.Middleware {
  return async (params, next) => {
    const model = params.model;

    // Only apply to tenant models
    if (!model || !TENANT_MODELS.includes(model)) {
      return next(params);
    }

    // Handle different query types
    switch (params.action) {
      case 'findUnique':
      case 'findFirst':
      case 'findMany':
      case 'count':
      case 'aggregate':
      case 'groupBy':
        // Add companyId filter to where clause
        params.args.where = {
          ...params.args.where,
          companyId,
        };
        break;

      case 'create':
      case 'createMany':
        // Auto-inject companyId into create data
        if (params.action === 'create') {
          params.args.data = {
            ...params.args.data,
            companyId,
          };
        } else if (params.action === 'createMany') {
          params.args.data = Array.isArray(params.args.data)
            ? params.args.data.map((item: any) => ({ ...item, companyId }))
            : { ...params.args.data, companyId };
        }
        break;

      case 'update':
      case 'updateMany':
      case 'delete':
      case 'deleteMany':
      case 'upsert':
        // Add companyId filter to where clause for safety
        params.args.where = {
          ...params.args.where,
          companyId,
        };

        // For upsert, also inject into create data
        if (params.action === 'upsert') {
          params.args.create = {
            ...params.args.create,
            companyId,
          };
        }
        break;
    }

    return next(params);
  };
}

/**
 * Global Prisma client with middleware applied
 * DO NOT use this directly - use the scoped client from withCompanyScope instead
 */
export { prisma } from './prisma';

/**
 * Creates a Prisma client scoped to a specific company
 *
 * Usage:
 * ```typescript
 * const scopedPrisma = withCompanyScope(session.user.companyId);
 * const users = await scopedPrisma.user.findMany(); // Automatically filtered by companyId
 * ```
 */
export function withCompanyScope(companyId: string) {
  const { prisma } = require('./prisma');

  // Create a new Prisma client instance with the middleware
  const scopedPrisma = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // Only apply to tenant models
          if (!TENANT_MODELS.includes(model)) {
            return query(args);
          }

          // Apply company scoping based on operation type
          switch (operation) {
            case 'findUnique':
            case 'findUniqueOrThrow':
            case 'findFirst':
            case 'findFirstOrThrow':
            case 'findMany':
            case 'count':
            case 'aggregate':
            case 'groupBy':
              args.where = { ...args.where, companyId };
              break;

            case 'create':
              args.data = { ...args.data, companyId };
              break;

            case 'createMany':
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({ ...item, companyId }));
              } else {
                args.data = { ...args.data, companyId };
              }
              break;

            case 'update':
            case 'updateMany':
            case 'delete':
            case 'deleteMany':
            case 'upsert':
              args.where = { ...args.where, companyId };

              if (operation === 'upsert') {
                args.create = { ...args.create, companyId };
              }
              break;
          }

          return query(args);
        },
      },
    },
  });

  return scopedPrisma;
}
