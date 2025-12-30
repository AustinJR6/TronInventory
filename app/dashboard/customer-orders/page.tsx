'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  total: number;
  customer: {
    id: string;
    businessName: string;
    accountNumber: string | null;
  };
  salesRep: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  items: Array<{
    id: string;
    requestedQty: number;
    pulledQty: number | null;
  }>;
  deliveryOrder: {
    id: string;
    deliveryNumber: string;
    status: string;
  } | null;
}

export default function CustomerOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/customer-orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'LOADED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'PULLED':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'APPROVED':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'SUBMITTED':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              Customer Orders
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              Manage customer orders and fulfillment
            </p>
          </div>
          <Link
            href="/dashboard/customer-orders/new"
            className="px-6 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
          >
            + Create Order
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-4 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="PULLED">Pulled</option>
                <option value="LOADED">Loaded</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
            <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
              {statusFilter
                ? 'No orders found matching your filters'
                : 'No customer orders yet. Create your first order to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
                <thead className="bg-ocean-light dark:bg-ocean-deep/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ocean-text dark:text-ocean-text-dark">
                          {order.orderNumber}
                        </div>
                        {order.deliveryOrder && (
                          <div className="text-xs text-ocean-muted dark:text-ocean-muted-dark">
                            {order.deliveryOrder.deliveryNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
                          {order.customer.businessName}
                        </div>
                        {order.customer.accountNumber && (
                          <div className="text-xs text-ocean-muted dark:text-ocean-muted-dark">
                            {order.customer.accountNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {order.salesRep?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {order.orderType === 'STANDARD' ? 'Standard' : order.orderType === 'RUSH' ? 'Rush' : 'Emergency'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-ocean-text dark:text-ocean-text-dark font-medium">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/customer-orders/${order.id}`}
                          className="text-ocean-accent dark:text-starlight hover:text-ocean-medium dark:hover:text-starlight-glow mr-4"
                        >
                          View
                        </Link>
                        {order.status === 'APPROVED' && (
                          <Link
                            href={`/dashboard/customer-orders/${order.id}/pull`}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          >
                            Pull
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
