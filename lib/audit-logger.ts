import { withCompanyScope } from './prisma-middleware';

type AuditLogInput = {
  companyId: string;
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, any>;
  reason?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Writes an audit log entry in a tenant-scoped manner.
 */
export async function createAuditLog(entry: AuditLogInput) {
  const prisma = withCompanyScope(entry.companyId);

  return prisma.auditLog.create({
    data: {
      companyId: entry.companyId,
      userId: entry.userId ?? null,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      changes: JSON.stringify(entry.changes ?? {}),
      reason: entry.reason ?? null,
      source: entry.source ?? 'ai',
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
