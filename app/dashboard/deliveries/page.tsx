'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Delivery {
  id: string;
  deliveryNumber: string;
  scheduledDate: string;
  status: string;
  route: {
    id: string;
    name: string;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  };
  customerOrder: {
    id: string;
    orderNumber: string;
    customer: {
      id: string;
      businessName: string;
      address: string;
      city: string | null;
    };
    items: Array<{
      id: string;
      pulledQty: number | null;
    }>;
  };
}

export default function DeliveriesPage() {
  const { data: session } = useSession();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/deliveries?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch deliveries');
      const data = await res.json();
      setDeliveries(data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'IN_TRANSIT':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'ARRIVED':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'LOADED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'SCHEDULED':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      case 'FAILED':
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
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading deliveries...</p>
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
              Deliveries
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              Track and manage delivery status
            </p>
          </div>
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
                <option value="SCHEDULED">Scheduled</option>
                <option value="LOADED">Loaded</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED">Arrived</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        {deliveries.length === 0 ? (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
            <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
              {statusFilter
                ? 'No deliveries found matching your filters'
                : 'No deliveries yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
                <thead className="bg-ocean-light dark:bg-ocean-deep/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Delivery #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ocean-text dark:text-ocean-text-dark">
                          {delivery.deliveryNumber}
                        </div>
                        <div className="text-xs text-ocean-muted dark:text-ocean-muted-dark">
                          {delivery.customerOrder.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {delivery.customerOrder.customer.businessName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                        {delivery.customerOrder.customer.city || delivery.customerOrder.customer.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {delivery.driver.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        <Link
                          href={`/dashboard/routes/${delivery.route.id}`}
                          className="text-ocean-accent dark:text-starlight hover:underline"
                        >
                          {delivery.route.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                        {new Date(delivery.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/deliveries/${delivery.id}`}
                          className="text-ocean-accent dark:text-starlight hover:text-ocean-medium dark:hover:text-starlight-glow"
                        >
                          View
                        </Link>
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
