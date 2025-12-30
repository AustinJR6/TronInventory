'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Customer {
  id: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string | null;
  accountNumber: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  route: {
    id: string;
    name: string;
  } | null;
  salesRep: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    orders: number;
    inventory: number;
  };
}

export default function CustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, routeFilter]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (routeFilter) params.append('routeId', routeFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.businessName.toLowerCase().includes(query) ||
      customer.contactName?.toLowerCase().includes(query) ||
      customer.accountNumber?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query)
    );
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      case 'SUSPENDED':
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
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading customers...</p>
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
              Customers
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              Manage your customer accounts and relationships
            </p>
          </div>
          <Link
            href="/dashboard/customers/new"
            className="px-6 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
          >
            + Add Customer
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, account, or city..."
                className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
              />
            </div>
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                Route
              </label>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
              >
                <option value="">All Routes</option>
                {/* Routes will be populated dynamically */}
              </select>
            </div>
          </div>
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
            <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
              {searchQuery || statusFilter || routeFilter
                ? 'No customers found matching your filters'
                : 'No customers yet. Add your first customer to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
                <thead className="bg-ocean-light dark:bg-ocean-deep/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-ocean-text dark:text-ocean-text-dark">
                            {customer.businessName}
                          </div>
                          {customer.accountNumber && (
                            <div className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
                              {customer.accountNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.contactName || '-'}
                        </div>
                        <div className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
                          {customer.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.city || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.route?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
                          {customer.salesRep?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            customer.status
                          )}`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                        {customer._count.orders}
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
    </div>
  );
}
