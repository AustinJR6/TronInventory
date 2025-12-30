'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  businessName: string;
}

interface WarehouseItem {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
}

interface InventoryCount {
  warehouseItemId: string;
  currentQty: number;
}

export default function CountInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
      fetchWarehouseItems();
      fetchCurrentInventory();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      const data = await res.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch warehouse items');
      const data = await res.json();
      setWarehouseItems(data);
    } catch (error) {
      console.error('Error fetching warehouse items:', error);
    }
  };

  const fetchCurrentInventory = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}/inventory`);
      if (!res.ok) throw new Error('Failed to fetch current inventory');
      const data = await res.json();

      const currentCounts = new Map<string, number>();
      data.forEach((item: any) => {
        currentCounts.set(item.warehouseItem.id, item.currentQty);
      });
      setCounts(currentCounts);
    } catch (error) {
      console.error('Error fetching current inventory:', error);
    }
  };

  const handleCountChange = (itemId: string, value: string) => {
    const qty = value === '' ? 0 : parseInt(value);
    if (!isNaN(qty) && qty >= 0) {
      setCounts(new Map(counts.set(itemId, qty)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each count
      for (const [warehouseItemId, currentQty] of counts.entries()) {
        const res = await fetch(`/api/customers/${params.id}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouseItemId, currentQty }),
        });

        if (!res.ok) {
          throw new Error('Failed to save inventory count');
        }
      }

      alert('Inventory counts saved successfully!');
      router.push(`/dashboard/customers/${params.id}`);
    } catch (error: any) {
      console.error('Error saving counts:', error);
      alert(error.message || 'Failed to save inventory counts');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = warehouseItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <p className="text-ocean-text dark:text-ocean-text-dark text-xl mb-4">Customer not found</p>
          <Link
            href="/dashboard/customers"
            className="text-ocean-accent dark:text-starlight hover:underline"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/dashboard/customers/${params.id}`}
          className="text-ocean-accent dark:text-starlight hover:underline mb-4 inline-block"
        >
          ← Back to {customer.businessName}
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              Count Inventory
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              {customer.businessName}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || counts.size === 0}
            className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? 'Saving...' : 'Save Counts'}
          </button>
        </div>

        {/* Search */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-4 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
          />
        </div>

        {/* Inventory Count Table */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
              <thead className="bg-ocean-light dark:bg-ocean-deep/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Current Count
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    New Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                {filteredItems.map((item) => {
                  const currentCount = counts.get(item.id) || 0;
                  return (
                    <tr key={item.id} className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50">
                      <td className="px-6 py-4 text-sm text-ocean-text dark:text-ocean-text-dark">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-ocean-muted dark:text-ocean-muted-dark">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-ocean-text dark:text-ocean-text-dark">
                        {item.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
                          {currentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          value={counts.get(item.id) || ''}
                          onChange={(e) => handleCountChange(item.id, e.target.value)}
                          className="w-24 mx-auto px-3 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark text-center focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              No products found matching your search
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-accent/20 dark:border-starlight/20 mt-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-ocean-accent dark:text-starlight mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
              <p className="font-semibold mb-2">Counting Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Only count items that need updating - empty fields will be ignored</li>
                <li>Enter 0 for items that are completely out of stock</li>
                <li>Use the search box to quickly find specific products</li>
                <li>All changes are saved at once when you click "Save Counts"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
