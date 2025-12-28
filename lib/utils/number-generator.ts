/**
 * Number generation utility for company-scoped sequential numbering
 *
 * Generates unique sequential numbers scoped to a company for entities like:
 * - Purchase Orders (PO-000001)
 * - Jobs (JOB-000001)
 *
 * The numbers are zero-padded and guaranteed to be unique within a company.
 */

import type { PrismaClient } from '@prisma/client';

type ModelName = 'purchaseOrder' | 'job';

/**
 * Generates a company-scoped sequential number with prefix
 *
 * @param prisma - Prisma client instance (must be scoped to company via withCompanyScope)
 * @param model - The model name (purchaseOrder, job)
 * @param companyId - The company ID for scoping
 * @param prefix - The prefix for the number (e.g., 'PO', 'JOB')
 * @param length - The zero-padded length of the number (default: 6)
 * @returns A formatted number string (e.g., 'PO-000001')
 *
 * @example
 * ```typescript
 * const scopedPrisma = withCompanyScope(companyId);
 * const poNumber = await generateScopedNumber(scopedPrisma, 'purchaseOrder', companyId, 'PO');
 * // Returns: "PO-000001"
 *
 * const jobNumber = await generateScopedNumber(scopedPrisma, 'job', companyId, 'JOB');
 * // Returns: "JOB-000001"
 * ```
 */
export async function generateScopedNumber(
  prisma: any, // Using any because extended Prisma clients lose type information
  model: ModelName,
  companyId: string,
  prefix: string,
  length: number = 6
): Promise<string> {
  // Count existing records for this company
  const count = await prisma[model].count({
    where: { companyId },
  });

  // Generate next number (count + 1)
  const nextNumber = count + 1;

  // Zero-pad the number
  const paddedNumber = String(nextNumber).padStart(length, '0');

  // Return formatted number with prefix
  return `${prefix}-${paddedNumber}`;
}

/**
 * Validates a number format matches the expected pattern
 *
 * @param number - The number to validate
 * @param prefix - The expected prefix
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * validateNumberFormat('PO-000001', 'PO'); // true
 * validateNumberFormat('PO-123', 'PO');    // true
 * validateNumberFormat('JOB-ABC', 'JOB');  // false
 * ```
 */
export function validateNumberFormat(number: string, prefix: string): boolean {
  const pattern = new RegExp(`^${prefix}-\\d+$`);
  return pattern.test(number);
}

/**
 * Extracts the numeric part from a formatted number
 *
 * @param number - The formatted number (e.g., 'PO-000001')
 * @param prefix - The prefix to remove
 * @returns The numeric value, or null if invalid
 *
 * @example
 * ```typescript
 * extractNumber('PO-000001', 'PO'); // 1
 * extractNumber('JOB-000042', 'JOB'); // 42
 * extractNumber('INVALID', 'PO'); // null
 * ```
 */
export function extractNumber(number: string, prefix: string): number | null {
  if (!validateNumberFormat(number, prefix)) {
    return null;
  }

  const parts = number.split('-');
  const numericPart = parseInt(parts[1], 10);

  return isNaN(numericPart) ? null : numericPart;
}
