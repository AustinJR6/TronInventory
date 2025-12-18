'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WarehouseItem {
  id: string;
  itemName: string;
  category: string;
  currentQty: number;
  unit: string;
}

interface OrderItem {
  warehouseItemId: string;
  requestedQty: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setItems(data.inventory);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (itemId: string, qty: number) => {
    if (qty > 0) {
      setOrderItems((prev) => ({ ...prev, [itemId]: qty }));
    } else {
      const newItems = { ...orderItems };
      delete newItems[itemId];
      setOrderItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const items: OrderItem[] = Object.entries(orderItems).map(([warehouseItemId, requestedQty]) => ({
      warehouseItemId,
      requestedQty,
    }));

    if (items.length === 0) {
      alert('Please add at least one item to your order');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, notes }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        router.push('/dashboard/my-orders');
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('An error occurred while creating the order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchTerm || item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItemsInOrder = Object.keys(orderItems).length;

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit New Order</h1>
        <p className="mt-2 text-gray-600">
          Select items you need from the warehouse inventory
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-tron-red text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-tron-red text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.itemName}
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.currentQty} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            min="0"
                            max={item.currentQty}
                            value={orderItems[item.id] || 0}
                            onChange={(e) =>
                              handleQtyChange(item.id, parseInt(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-tron-red focus:border-transparent"
                          />
                          <span className="ml-2 text-gray-500">{item.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{totalItemsInOrder}</span> item
                  {totalItemsInOrder !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Add any special instructions or notes..."
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting || totalItemsInOrder === 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>

              {totalItemsInOrder > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Items:</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {Object.entries(orderItems).map(([itemId, qty]) => {
                      const item = items.find((i) => i.id === itemId);
                      return item ? (
                        <div key={itemId} className="text-xs text-blue-800">
                          {item.itemName}: {qty} {item.unit}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
