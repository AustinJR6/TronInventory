'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VehicleItem {
  id: string;
  itemName: string;
  category: string;
  parLevel: number;
  unit: string;
}

interface StockItem {
  itemId: string;
  expectedQty: number;
  actualQty: number;
}

export default function VehicleStockPage() {
  const router = useRouter();
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [stockItems, setStockItems] = useState<Record<string, StockItem>>({});
  const [weekEnding, setWeekEnding] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchVehicleItems();
    // Set default week ending to next Sunday
    const today = new Date();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
    setWeekEnding(nextSunday.toISOString().split('T')[0]);
  }, []);

  const fetchVehicleItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicle-stock');
      const data = await response.json();
      setItems(data.items);

      // Get unique categories
      const uniqueCategories = Array.from(
        new Set(data.items.map((item: VehicleItem) => item.category))
      ) as string[];
      setCategories(uniqueCategories);

      // Initialize stock items with par levels
      const initialStock: Record<string, StockItem> = {};
      data.items.forEach((item: VehicleItem) => {
        initialStock[item.id] = {
          itemId: item.id,
          expectedQty: item.parLevel,
          actualQty: 0,
        };
      });
      setStockItems(initialStock);
    } catch (error) {
      console.error('Error fetching vehicle items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActualQtyChange = (itemId: string, value: number) => {
    setStockItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        actualQty: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/vehicle-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekEnding,
          items: Object.values(stockItems),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        if (data.order) {
          router.push('/dashboard/my-orders');
        } else {
          router.push('/dashboard');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        alert(`Failed to submit vehicle stock: ${errorData.error || errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting vehicle stock:', error);
      alert(`An error occurred while submitting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifference = (itemId: string) => {
    const stock = stockItems[itemId];
    if (!stock) return 0;
    return stock.expectedQty - stock.actualQty;
  };

  if (loading) {
    return <div className="text-center py-8">Loading vehicle items...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Stock Check</h1>
        <p className="mt-2 text-gray-600">
          Update your vehicle inventory. Items below par level will automatically generate an order.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Week Ending Date
          </label>
          <input
            type="date"
            value={weekEnding}
            onChange={(e) => setWeekEnding(e.target.value)}
            className="input-field max-w-xs"
            required
          />
        </div>

        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category === category);

          return (
            <div key={category} className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Par Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryItems.map((item) => {
                      const difference = getDifference(item.id);
                      const needsRestock = difference > 0;

                      return (
                        <tr key={item.id} className={needsRestock ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.parLevel} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="number"
                              min="0"
                              value={stockItems[item.id]?.actualQty || 0}
                              onChange={(e) =>
                                handleActualQtyChange(item.id, parseInt(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-tron-red focus:border-transparent"
                              required
                            />
                            <span className="ml-2 text-gray-500">{item.unit}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-medium ${
                                needsRestock ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {needsRestock ? `-${difference}` : difference === 0 ? '0' : `+${Math.abs(difference)}`}
                            </span>
                            {needsRestock && (
                              <span className="ml-2 badge badge-in-progress text-xs">
                                Will order {difference} {item.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Vehicle Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
