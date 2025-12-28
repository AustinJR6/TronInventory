/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */

import { prisma } from './prisma';
import type { LicenseStatus, LicenseTier, UserRole } from '@prisma/client';

/**
 * Feature mapping by license tier
 *
 * BASE ($49.99/mo): 1 branch, 10 users
 *   - All core features EXCEPT: PO System, AI BOM Builder, Lana AI
 *
 * ELITE ($99.99/mo): 5 branches, 100 users
 *   - All features including PO System, AI BOM Builder, Lana AI
 */
const TIER_FEATURES: Record<LicenseTier, string[]> = {
  BASE: [
    'inventoryTracking',
    'manualAdjustments',
    'orderManagement',
    'vehicleStock',
    'roleBasedAccess',
    'barcodeScanning',
    'qrScanning',
    'partRequests',
    'supplierManagement',
    'inventoryThresholds',
  ],

  ELITE: [
    'inventoryTracking',
    'manualAdjustments',
    'orderManagement',
    'vehicleStock',
    'roleBasedAccess',
    'barcodeScanning',
    'qrScanning',
    'partRequests',
    'supplierManagement',
    'inventoryThresholds',
    'purchaseOrders',
    'poCompilation',
    'aiBomBuilder',
    'aiAssistant',
  ],
};

/**
 * Check if a license tier includes a specific feature
 */
export function hasFeature(tier: LicenseTier, feature: string): boolean {
  return TIER_FEATURES[tier]?.includes(feature) || false;
}

/**
 * Enforce license requirements
 * Throws error if license is invalid or feature not available
 *
 * @param companyId - Company ID to check license for
 * @param requiredFeature - Optional feature to check tier access
 * @param allowReadOnly - If true, allows read access even with suspended/expired license
 */
export async function enforceLicense(
  companyId: string,
  requiredFeature?: string,
  allowReadOnly = false
): Promise<{
  tier: LicenseTier;
  status: LicenseStatus;
  expiresAt: Date | null;
}> {
  const license = await prisma.license.findUnique({
    where: { companyId },
  });

  if (!license) {
    throw new Error('No license found for this company');
  }

  // Check if license is active or in trial
  const isActive = license.status === 'ACTIVE' || license.status === 'TRIAL';
  const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();

  // If read-only mode is allowed and license is suspended/expired, return license info
  if (allowReadOnly && !isActive) {
    return {
      tier: license.tier,
      status: license.status,
      expiresAt: license.expiresAt,
    };
  }

  // For write operations or when read-only is not allowed, enforce active license
  if (!isActive) {
    throw new Error(`License is ${license.status.toLowerCase()}. Please contact support.`);
  }

  // Check if license is expired
  if (isExpired) {
    throw new Error('License has expired. Please renew your subscription.');
  }

  // Check if feature is available in current tier
  if (requiredFeature && !hasFeature(license.tier, requiredFeature)) {
    throw new Error(
      `Feature '${requiredFeature}' is not available in your ${license.tier} plan. Please upgrade.`
    );
  }

  return {
    tier: license.tier,
    status: license.status,
    expiresAt: license.expiresAt,
  };
}

/**
 * Enforce role-based access
 * Throws error if user doesn't have required role
 */
export function enforceRole(userRole: string, requiredRole: UserRole | UserRole[]): void {
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!requiredRoles.includes(userRole as UserRole)) {
    const rolesStr = requiredRoles.join(' or ');
    throw new Error(`Access denied. Required role: ${rolesStr}`);
  }
}

/**
 * Combined enforcement for session, role, and license
 *
 * Usage in API routes:
 * ```typescript
 * // For write operations (default - requires active license)
 * const { license } = await enforceAll(session, {
 *   role: 'ADMIN',
 *   feature: 'supplierManagement'
 * });
 *
 * // For read operations (allows suspended/expired licenses)
 * const { license } = await enforceAll(session, {
 *   allowReadOnly: true
 * });
 * ```
 */
export async function enforceAll(
  session: any,
  options?: {
    role?: UserRole | UserRole[];
    feature?: string;
    allowReadOnly?: boolean;
  }
): Promise<{
  userId: string;
  companyId: string;
  userRole: string;
  license: {
    tier: LicenseTier;
    status: LicenseStatus;
    expiresAt: Date | null;
  };
}> {
  // 1. Check session exists
  if (!session || !session.user) {
    throw new Error('Authentication required');
  }

  const { id: userId, companyId, role: userRole } = session.user;

  if (!companyId) {
    throw new Error('No company associated with user');
  }

  // 2. Enforce role if specified
  if (options?.role) {
    enforceRole(userRole, options.role);
  }

  // 3. Enforce license (and feature if specified)
  // By default, write operations require active license
  // Read operations can optionally allow suspended/expired licenses
  const license = await enforceLicense(
    companyId,
    options?.feature,
    options?.allowReadOnly ?? false
  );

  return {
    userId,
    companyId,
    userRole,
    license,
  };
}

/**
 * Check if license allows read-only access
 * Useful for showing data even when license is suspended/expired
 */
export function isReadOnlyMode(status: LicenseStatus): boolean {
  return status === 'SUSPENDED' || status === 'EXPIRED';
}

/**
 * Get user-friendly error message for license issues
 */
export function getLicenseErrorMessage(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('suspended')) {
    return 'Your license is suspended. Please contact support to reactivate.';
  }

  if (msg.includes('expired')) {
    return 'Your license has expired. Please renew your subscription.';
  }

  if (msg.includes('not available')) {
    return 'This feature is not available in your current plan. Please upgrade.';
  }

  if (msg.includes('no license')) {
    return 'No valid license found. Please contact support.';
  }

  return 'License validation failed. Please contact support.';
}

/**
 * Get tier limits for branches and users
 */
export function getTierLimits(tier: LicenseTier): {
  includedBranches: number;
  includedUsers: number;
  price: number;
} {
  switch (tier) {
    case 'BASE':
      return {
        includedBranches: 1,
        includedUsers: 10,
        price: 49.99,
      };
    case 'ELITE':
      return {
        includedBranches: 5,
        includedUsers: 100,
        price: 99.99,
      };
    default:
      return {
        includedBranches: 1,
        includedUsers: 10,
        price: 49.99,
      };
  }
}

/**
 * Check if company can add more branches/users
 */
export async function checkCapacityLimits(
  companyId: string,
  type: 'branch' | 'user'
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  additionalCost?: number;
}> {
  const license = await prisma.license.findUnique({
    where: { companyId },
    include: {
      company: {
        include: {
          branches: true,
          users: { where: { active: true } },
        },
      },
    },
  });

  if (!license) {
    throw new Error('No license found');
  }

  const limits = getTierLimits(license.tier);
  const totalBranchLimit = limits.includedBranches + license.additionalBranches;
  const totalUserLimit = limits.includedUsers + license.additionalUsers;

  if (type === 'branch') {
    const currentBranches = license.company.branches.filter((b) => b.active).length;
    return {
      allowed: currentBranches < totalBranchLimit,
      current: currentBranches,
      limit: totalBranchLimit,
      additionalCost: 19.99,
    };
  } else {
    const currentUsers = license.company.users.length;
    return {
      allowed: currentUsers < totalUserLimit,
      current: currentUsers,
      limit: totalUserLimit,
      additionalCost: 1.0,
    };
  }
}
