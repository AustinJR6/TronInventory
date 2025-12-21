'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WarehouseItem {
  id: string;
  itemName: string;
  category: string;
  currentQty: number;
  unit: string;
  branchId: string | null;
}

interface OrderItem {
  warehouseItemId: string;
  requestedQty: number;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchInventory();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const url = selectedBranch
        ? `/api/inventory?branchId=${selectedBranch}`
        : '/api/inventory';
      const response = await fetch(url);
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
        body: JSON.stringify({ items, notes, branchId: selectedBranch || null }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        router.push('/dashboard/my-orders');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        alert(`Failed to create order: ${errorData.error || errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(`An error occurred while creating the order: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    return <div className="text-center py-8 text-gray-900 dark:text-white">Loading inventory...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Submit New Order</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          Select items you need from the warehouse inventory
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-2">
                  Select Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setOrderItems({});
                  }}
                  className="input-field mb-4"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
                </select>
              </div>

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
                      ? 'bg-sherbet-orange dark:bg-tron-orange text-white'
                      : 'bg-cream-dark dark:bg-tron-gray text-text-light dark:text-gray-300 border border-sherbet-orange/30 dark:border-tron-orange/30 hover:bg-cream dark:hover:bg-tron-gray-light'
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
                        ? 'bg-sherbet-orange dark:bg-tron-orange text-white'
                        : 'bg-cream-dark dark:bg-tron-gray text-text-light dark:text-gray-300 border border-sherbet-orange/30 dark:border-tron-orange/30 hover:bg-cream dark:hover:bg-tron-gray-light'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sherbet-orange/20 dark:divide-tron-orange/20">
                  <thead className="bg-cream-dark dark:bg-tron-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-tron-gray-light divide-y divide-sherbet-orange/20 dark:divide-tron-orange/20">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-cream dark:hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {item.itemName}
                          <div className="text-xs text-gray-600 dark:text-gray-400">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {item.currentQty} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <input
                            type="number"
                            min="0"
                            max={item.currentQty}
                            value={orderItems[item.id] || 0}
                            onChange={(e) =>
                              handleQtyChange(item.id, parseInt(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 border-2 border-sherbet-orange dark:border-tron-orange/30 rounded-md focus:ring-2 focus:ring-sherbet-orange-dark dark:focus:ring-tron-orange bg-white dark:bg-tron-black text-gray-900 dark:text-white font-medium"
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">{item.unit}</span>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{totalItemsInOrder}</span> item
                  {totalItemsInOrder !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-2">
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
                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Selected Items:</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {Object.entries(orderItems).map(([itemId, qty]) => {
                      const item = items.find((i) => i.id === itemId);
                      return item ? (
                        <div key={itemId} className="text-xs text-blue-800 dark:text-blue-300">
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
