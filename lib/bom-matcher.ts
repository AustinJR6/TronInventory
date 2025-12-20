import { MatchConfidence } from '@prisma/client';

export interface MatchResult {
  warehouseItemId: string | null;
  confidence: MatchConfidence;
  reason: string;
}

/**
 * Intelligently matches an extracted BOM item to warehouse inventory
 * Uses exact matching, fuzzy matching, and category matching
 *
 * @param extractedItem - The item extracted from PDF by AI
 * @param warehouseInventory - Available warehouse inventory items
 * @returns Match result with warehouse item ID, confidence, and reason
 */
export function matchBomItemToInventory(
  extractedItem: {
    itemName: string;
    category?: string;
    unit?: string;
  },
  warehouseInventory: Array<{
    id: string;
    itemName: string;
    sku?: string | null;
    category: string;
    unit: string;
  }>
): MatchResult {
  const extractedLower = extractedItem.itemName.toLowerCase().trim();

  // Strategy 1: Exact match on item name (case-insensitive)
  const exactMatch = warehouseInventory.find(
    (item) => item.itemName.toLowerCase().trim() === extractedLower
  );

  if (exactMatch) {
    return {
      warehouseItemId: exactMatch.id,
      confidence: 'HIGH',
      reason: 'Exact match on item name',
    };
  }

  // Strategy 2: Fuzzy match - check if one contains the other
  const fuzzyMatches = warehouseInventory.filter((item) => {
    const warehouseLower = item.itemName.toLowerCase().trim();
    return (
      warehouseLower.includes(extractedLower) ||
      extractedLower.includes(warehouseLower)
    );
  });

  if (fuzzyMatches.length === 1) {
    const match = fuzzyMatches[0];

    // Check if category also matches for higher confidence
    const categoryMatch =
      extractedItem.category &&
      match.category.toLowerCase() === extractedItem.category.toLowerCase();

    // Check if unit also matches
    const unitMatch =
      extractedItem.unit &&
      match.unit.toLowerCase() === extractedItem.unit.toLowerCase();

    if (categoryMatch && unitMatch) {
      return {
        warehouseItemId: match.id,
        confidence: 'HIGH',
        reason: 'Partial name match with category and unit match',
      };
    }

    if (categoryMatch) {
      return {
        warehouseItemId: match.id,
        confidence: 'MEDIUM',
        reason: 'Partial name match with category match',
      };
    }

    return {
      warehouseItemId: match.id,
      confidence: 'LOW',
      reason: 'Partial name match only - review recommended',
    };
  }

  // Strategy 3: Multiple fuzzy matches - try to disambiguate with category
  if (fuzzyMatches.length > 1 && extractedItem.category) {
    const categoryFilteredMatches = fuzzyMatches.filter(
      (item) =>
        item.category.toLowerCase() === extractedItem.category!.toLowerCase()
    );

    if (categoryFilteredMatches.length === 1) {
      return {
        warehouseItemId: categoryFilteredMatches[0].id,
        confidence: 'MEDIUM',
        reason: 'Multiple name matches - selected by category',
      };
    }
  }

  // Strategy 4: Category-only match (weak, requires manual review)
  if (extractedItem.category) {
    const categoryMatches = warehouseInventory.filter(
      (item) =>
        item.category.toLowerCase() === extractedItem.category!.toLowerCase()
    );

    // Only suggest if there's exactly one item in that category
    if (categoryMatches.length === 1) {
      return {
        warehouseItemId: categoryMatches[0].id,
        confidence: 'LOW',
        reason: 'Category match only - name differs, needs review',
      };
    }
  }

  // No match found - requires manual selection
  return {
    warehouseItemId: null,
    confidence: 'MANUAL',
    reason: 'No automatic match found - manual selection required',
  };
}

/**
 * Calculates a similarity score between two strings (0-1)
 * Uses Jaccard similarity on word sets
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Batch matches multiple extracted items to warehouse inventory
 * More efficient than calling matchBomItemToInventory repeatedly
 */
export function batchMatchBomItems(
  extractedItems: Array<{
    itemName: string;
    category?: string;
    unit?: string;
  }>,
  warehouseInventory: Array<{
    id: string;
    itemName: string;
    sku?: string | null;
    category: string;
    unit: string;
  }>
): MatchResult[] {
  return extractedItems.map((item) =>
    matchBomItemToInventory(item, warehouseInventory)
  );
}
