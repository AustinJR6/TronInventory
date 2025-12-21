'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  notes: string | null;
  branchId: string | null;
  createdAt: string;
  branch?: {
    id: string;
    name: string;
    city: string;
  };
  items: {
    id: string;
    requestedQty: number;
    pulledQty: number;
    warehouseItem: {
      itemName: string;
      unit: string;
    };
  }[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = selectedStatus
        ? `/api/orders?status=${selectedStatus}`
        : '/api/orders';
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      SUBMITTED: 'badge-submitted',
      IN_PROGRESS: 'badge-in-progress',
      READY: 'badge-ready',
      COMPLETED: 'badge-completed',
    };
    return badges[status as keyof typeof badges] || 'badge';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-900 dark:text-white">Loading orders...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm">My Orders</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">View and track your order status</p>
        </div>
        <Link href="/dashboard/new-order" className="btn-primary">
          New Order
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === ''
              ? 'bg-sherbet-orange dark:bg-tron-orange text-white'
              : 'bg-cream-dark dark:bg-tron-gray text-text-light dark:text-gray-300 border border-sherbet-orange/30 dark:border-tron-orange/30 hover:bg-cream dark:hover:bg-tron-gray-light'
          }`}
        >
          All Orders
        </button>
        {['SUBMITTED', 'IN_PROGRESS', 'READY', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-sherbet-orange dark:bg-tron-orange text-white'
                : 'bg-cream-dark dark:bg-tron-gray text-text-light dark:text-gray-300 border border-sherbet-orange/30 dark:border-tron-orange/30 hover:bg-cream dark:hover:bg-tron-gray-light'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No orders found</p>
          <Link href="/dashboard/new-order" className="btn-primary">
            Create Your First Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order #{order.orderNumber}
                    {order.branch && <span className="text-sherbet-orange dark:text-tron-orange ml-2 text-base font-medium">• {order.branch.name}</span>}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-cream-dark dark:bg-tron-black text-gray-700 dark:text-gray-300 rounded border border-sherbet-orange/30 dark:border-tron-orange/30">
                    {order.orderType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-semibold">Notes:</span> {order.notes}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sherbet-orange/20 dark:divide-tron-orange/20">
                  <thead className="bg-cream-dark dark:bg-tron-black">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase">
                        Requested
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-sherbet-orange-dark dark:text-tron-orange uppercase">
                        Pulled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-tron-gray-light divide-y divide-sherbet-orange/20 dark:divide-tron-orange/20">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {item.warehouseItem.itemName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {item.requestedQty} {item.warehouseItem.unit}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {item.pulledQty > 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {item.pulledQty} {item.warehouseItem.unit}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Not pulled yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
