'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    businessName: string;
    address: string;
  };
  items: Array<{
    id: string;
    requestedQty: number;
    pulledQty: number | null;
    unitPrice: number;
    warehouseItem: {
      id: string;
      name: string;
      sku: string;
      unitOfMeasure: string;
      currentQty: number;
    };
  }>;
}

interface PullItem {
  itemId: string;
  pulledQty: number;
}

export default function PullOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pullQuantities, setPullQuantities] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/customer-orders/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      setOrder(data);

      // Initialize pull quantities with requested quantities
      const quantities = new Map<string, number>();
      data.items.forEach((item: any) => {
        quantities.set(item.id, item.requestedQty);
      });
      setPullQuantities(quantities);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePullQtyChange = (itemId: string, value: string) => {
    const qty = value === '' ? 0 : parseInt(value);
    if (!isNaN(qty) && qty >= 0) {
      setPullQuantities(new Map(pullQuantities.set(itemId, qty)));
    }
  };

  const handlePullAll = async () => {
    if (!order) return;

    const confirm = window.confirm(
      'Are you sure you want to pull all items for this order? This will decrement warehouse inventory.'
    );

    if (!confirm) return;

    setSaving(true);
    try {
      const items: PullItem[] = [];
      pullQuantities.forEach((pulledQty, itemId) => {
        if (pulledQty > 0) {
          items.push({ itemId, pulledQty });
        }
      });

      const res = await fetch(`/api/customer-orders/${params.id}/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to pull order');
      }

      alert('Order pulled successfully!');
      router.push(`/dashboard/customer-orders/${params.id}`);
    } catch (error: any) {
      console.error('Error pulling order:', error);
      alert(error.message || 'Failed to pull order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <p className="text-ocean-text dark:text-ocean-text-dark text-xl mb-4">Order not found</p>
          <Link
            href="/dashboard/customer-orders"
            className="text-ocean-accent dark:text-starlight hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/dashboard/customer-orders/${params.id}`}
          className="text-ocean-accent dark:text-starlight hover:underline mb-4 inline-block"
        >
          ← Back to Order
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              Pull Order
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              {order.orderNumber} - {order.customer.businessName}
            </p>
          </div>
          <button
            onClick={handlePullAll}
            disabled={saving}
            className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? 'Pulling...' : 'Complete Pull'}
          </button>
        </div>

        {/* Delivery Info */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
            Delivery Information
          </h2>
          <p className="text-ocean-text dark:text-ocean-text-dark">{order.customer.address}</p>
        </div>

        {/* Pull Items */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden mb-6">
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    In Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Pull Qty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                {order.items.map((item) => {
                  const pullQty = pullQuantities.get(item.id) || 0;
                  const available = item.warehouseItem.currentQty;
                  const canFulfill = available >= pullQty;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50 ${
                        !canFulfill ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-ocean-text dark:text-ocean-text-dark">
                        {item.warehouseItem.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-ocean-muted dark:text-ocean-muted-dark">
                        {item.warehouseItem.sku}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm font-medium ${
                            canFulfill
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {available} {item.warehouseItem.unitOfMeasure}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-ocean-text dark:text-ocean-text-dark">
                        {item.requestedQty} {item.warehouseItem.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={available}
                          value={pullQty}
                          onChange={(e) => handlePullQtyChange(item.id, e.target.value)}
                          className={`w-24 mx-auto px-3 py-2 bg-white dark:bg-ocean-deep/50 border rounded-md text-ocean-text dark:text-ocean-text-dark text-center focus:outline-none focus:ring-2 ${
                            canFulfill
                              ? 'border-ocean-medium/30 dark:border-starlight/30 focus:ring-ocean-accent dark:focus:ring-starlight'
                              : 'border-red-300 dark:border-red-600 focus:ring-red-500'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {canFulfill ? (
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Available
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            ! Insufficient Stock
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

        {/* Instructions */}
        <div className="bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-accent/20 dark:border-starlight/20">
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
              <p className="font-semibold mb-2">Pulling Instructions:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Verify all items are available before completing the pull</li>
                <li>Adjust pull quantities if needed (cannot exceed available stock)</li>
                <li>Items highlighted in red have insufficient stock</li>
                <li>Completing the pull will decrement warehouse inventory</li>
                <li>Order status will change to "PULLED" and be ready for loading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
