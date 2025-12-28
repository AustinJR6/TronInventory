'use client';

import { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import { MatchConfidence } from '@prisma/client';

interface BomItem {
  id: string;
  extractedItemName: string;
  extractedQuantity: number;
  extractedUnit: string | null;
  extractedCategory: string | null;
  warehouseItemId: string | null;
  matchConfidence: MatchConfidence;
  aiMatchReason: string | null;
  manuallyOverridden: boolean;
  warehouseItem: {
    id: string;
    itemName: string;
    category: string;
    unit: string;
    currentQty: number;
  } | null;
}

interface BomReviewTableProps {
  items: BomItem[];
  warehouseInventory: Array<{
    id: string;
    itemName: string;
    category: string;
    unit: string;
    currentQty: number;
  }>;
  onSave: (updatedItems: any[]) => Promise<void>;
  onSubmit: () => void;
  isSaving: boolean;
}

export default function BomReviewTable({
  items: initialItems,
  warehouseInventory,
  onSave,
  onSubmit,
  isSaving,
}: BomReviewTableProps) {
  const [items, setItems] = useState(initialItems);
  const [hasChanges, setHasChanges] = useState(false);

  const updateItem = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value, manuallyOverridden: true } : item
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updates = items.map((item) => ({
      id: item.id,
      warehouseItemId: item.warehouseItemId,
      extractedQuantity: item.extractedQuantity,
      manuallyOverridden: item.manuallyOverridden,
    }));

    await onSave(updates);
    setHasChanges(false);
  };

  const canSubmit = items.every((item) => item.warehouseItemId !== null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-ocean-deep">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Extracted Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Warehouse Match
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Match Quality
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-ocean-dark divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-ocean-deep">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium dark:text-white">
                      {item.extractedItemName}
                    </div>
                    {item.extractedCategory && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.extractedCategory}
                        {item.extractedUnit && ` • ${item.extractedUnit}`}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="number"
                    value={item.extractedQuantity}
                    onChange={(e) =>
                      updateItem(item.id, 'extractedQuantity', parseInt(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-ocean-deep dark:text-white"
                    min="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.warehouseItemId || ''}
                    onChange={(e) => updateItem(item.id, 'warehouseItemId', e.target.value || null)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-ocean-deep dark:text-white"
                  >
                    <option value="">-- Select warehouse item --</option>
                    {warehouseInventory.map((invItem) => (
                      <option key={invItem.id} value={invItem.id}>
                        {invItem.itemName} ({invItem.category})
                      </option>
                    ))}
                  </select>
                  {item.aiMatchReason && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.aiMatchReason}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <ConfidenceBadge confidence={item.matchConfidence} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.warehouseItem && (
                    <span
                      className={`text-sm ${
                        item.warehouseItem.currentQty >= item.extractedQuantity
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {item.warehouseItem.currentQty} {item.warehouseItem.unit}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
          {items.filter((i) => i.warehouseItemId).length} of {items.length} items matched
        </div>

        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-secondary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          <button
            onClick={onSubmit}
            disabled={!canSubmit || hasChanges || isSaving}
            className="btn-primary"
            title={
              !canSubmit
                ? 'All items must have warehouse matches'
                : hasChanges
                ? 'Save changes first'
                : 'Submit as order'
            }
          >
            Submit as Order
          </button>
        </div>
      </div>

      {!canSubmit && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ Please select warehouse items for all red-flagged entries before submitting
          </p>
        </div>
      )}
    </div>
  );
}
