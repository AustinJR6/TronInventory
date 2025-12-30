'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Route {
  id: string;
  name: string;
  description: string | null;
  daysOfWeek: string[];
  isActive: boolean;
  driver: {
    id: string;
    name: string;
    email: string;
  } | null;
  customers: Array<{
    id: string;
    businessName: string;
    address: string;
    city: string | null;
    salesRep: {
      id: string;
      name: string;
    } | null;
  }>;
  deliveries: Array<{
    id: string;
    deliveryNumber: string;
    scheduledDate: string;
    status: string;
    customerOrder: {
      id: string;
      orderNumber: string;
      customer: {
        id: string;
        businessName: string;
      };
    };
  }>;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchRoute();
    }
  }, [params.id]);

  const fetchRoute = async () => {
    try {
      const res = await fetch(`/api/routes/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch route');
      const data = await res.json();
      setRoute(data);
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const res = await fetch(`/api/routes/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete route');
      }

      router.push('/dashboard/routes');
    } catch (error: any) {
      console.error('Error deleting route:', error);
      alert(error.message || 'Failed to delete route');
    }
  };

  const getDaysDisplay = (days: string[]) => {
    if (days.length === 0) return 'No days set';
    if (days.length === 7) return 'Every day';

    const dayMap: Record<string, string> = {
      MONDAY: 'Mon',
      TUESDAY: 'Tue',
      WEDNESDAY: 'Wed',
      THURSDAY: 'Thu',
      FRIDAY: 'Fri',
      SATURDAY: 'Sat',
      SUNDAY: 'Sun',
    };

    return days.map((d) => dayMap[d] || d).join(', ');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'IN_TRANSIT':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'LOADED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'SCHEDULED':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading route...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <p className="text-ocean-text dark:text-ocean-text-dark text-xl mb-4">Route not found</p>
          <Link
            href="/dashboard/routes"
            className="text-ocean-accent dark:text-starlight hover:underline"
          >
            Back to Routes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              href="/dashboard/routes"
              className="text-ocean-accent dark:text-starlight hover:underline mb-2 inline-block"
            >
              ← Back to Routes
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark">
                {route.name}
              </h1>
              {!route.isActive && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300">
                  Inactive
                </span>
              )}
            </div>
            {route.description && (
              <p className="text-ocean-muted dark:text-ocean-muted-dark mt-2">
                {route.description}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/routes/${route.id}/edit`}
              className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Route Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Route Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Driver</label>
                <p className="text-ocean-text dark:text-ocean-text-dark">
                  {route.driver?.name || 'Unassigned'}
                </p>
                {route.driver?.email && (
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">{route.driver.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Days of Week</label>
                <p className="text-ocean-text dark:text-ocean-text-dark">
                  {getDaysDisplay(route.daysOfWeek)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Statistics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-ocean-muted dark:text-ocean-muted-dark">Total Customers:</span>
                <span className="text-ocean-text dark:text-ocean-text-dark font-semibold">
                  {route.customers.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ocean-muted dark:text-ocean-muted-dark">Today's Deliveries:</span>
                <span className="text-ocean-text dark:text-ocean-text-dark font-semibold">
                  {route.deliveries.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customers on Route */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
            Customers on Route ({route.customers.length})
          </h2>
          {route.customers.length === 0 ? (
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-8 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
              <p className="text-ocean-muted dark:text-ocean-muted-dark">
                No customers assigned to this route yet
              </p>
            </div>
          ) : (
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
                  <thead className="bg-ocean-light dark:bg-ocean-deep/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Sales Rep
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                    {route.customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.businessName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                          {customer.city || customer.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.salesRep?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
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

        {/* Today's Deliveries */}
        <div>
          <h2 className="text-2xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
            Today's Deliveries ({route.deliveries.length})
          </h2>
          {route.deliveries.length === 0 ? (
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-8 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
              <p className="text-ocean-muted dark:text-ocean-muted-dark">
                No deliveries scheduled for today
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
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                    {route.deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark font-medium">
                          {delivery.deliveryNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                          {delivery.customerOrder.customer.businessName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                          {delivery.customerOrder.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              delivery.status
                            )}`}
                          >
                            {delivery.status}
                          </span>
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
    </div>
  );
}
