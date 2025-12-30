'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  deliveryInstructions: string | null;
  accountNumber: string | null;
  status: string;
  creditLimit: number | null;
  paymentTerms: string | null;
  route: {
    id: string;
    name: string;
  } | null;
  salesRep: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface InventoryItem {
  id: string;
  currentQty: number;
  lastCountDate: Date | null;
  warehouseItem: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  parLevel: number;
  needed: number;
}

interface ParLevel {
  id: string;
  parLevel: number;
  warehouseItem: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [parLevels, setParLevels] = useState<ParLevel[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'inventory' | 'orders'>('details');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
      fetchInventory();
      fetchParLevels();
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

  const fetchInventory = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}/inventory`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchParLevels = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}/par-levels`);
      if (!res.ok) throw new Error('Failed to fetch par levels');
      const data = await res.json();
      setParLevels(data);
    } catch (error) {
      console.error('Error fetching par levels:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      await fetchCustomer();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading customer...</p>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              href="/dashboard/customers"
              className="text-ocean-accent dark:text-starlight hover:underline mb-2 inline-block"
            >
              ← Back to Customers
            </Link>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              {customer.businessName}
            </h1>
            {customer.accountNumber && (
              <p className="text-ocean-muted dark:text-ocean-muted-dark">
                Account: {customer.accountNumber}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/customers/${customer.id}/edit`}
              className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
            >
              Edit
            </Link>
            <Link
              href={`/dashboard/customer-orders/new?customerId=${customer.id}`}
              className="px-6 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
            >
              Create Order
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-ocean-medium/30 dark:border-starlight/30 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-ocean-accent dark:border-starlight text-ocean-accent dark:text-starlight'
                  : 'border-transparent text-ocean-muted dark:text-ocean-muted-dark hover:text-ocean-text dark:hover:text-ocean-text-dark hover:border-ocean-medium/30'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-ocean-accent dark:border-starlight text-ocean-accent dark:text-starlight'
                  : 'border-transparent text-ocean-muted dark:text-ocean-muted-dark hover:text-ocean-text dark:hover:text-ocean-text-dark hover:border-ocean-medium/30'
              }`}
            >
              Inventory ({inventory.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-ocean-accent dark:border-starlight text-ocean-accent dark:text-starlight'
                  : 'border-transparent text-ocean-muted dark:text-ocean-muted-dark hover:text-ocean-text dark:hover:text-ocean-text-dark hover:border-ocean-medium/30'
              }`}
            >
              Orders
            </button>
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
              <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
                Contact Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Contact Name</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">{customer.contactName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Phone</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">{customer.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Email</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">{customer.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
              <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
                Address
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-ocean-text dark:text-ocean-text-dark">{customer.address}</p>
                  <p className="text-ocean-text dark:text-ocean-text-dark">
                    {customer.city}, {customer.state} {customer.zipCode}
                  </p>
                </div>
                {customer.deliveryInstructions && (
                  <div>
                    <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Delivery Instructions</label>
                    <p className="text-ocean-text dark:text-ocean-text-dark">{customer.deliveryInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
              <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
                Account Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      customer.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      customer.status === 'INACTIVE' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Credit Limit</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">
                    {customer.creditLimit ? `$${customer.creditLimit.toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Payment Terms</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">{customer.paymentTerms || '-'}</p>
                </div>
              </div>
            </div>

            {/* Route & Sales Rep */}
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
              <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
                Route & Sales Rep
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Route</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">
                    {customer.route ? (
                      <Link href={`/dashboard/routes/${customer.route.id}`} className="text-ocean-accent dark:text-starlight hover:underline">
                        {customer.route.name}
                      </Link>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Sales Representative</label>
                  <p className="text-ocean-text dark:text-ocean-text-dark">
                    {customer.salesRep?.name || '-'}
                  </p>
                  {customer.salesRep?.email && (
                    <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">{customer.salesRep.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-ocean-muted dark:text-ocean-muted-dark">
                Current inventory levels and par requirements
              </p>
              <Link
                href={`/dashboard/customers/${customer.id}/count-inventory`}
                className="px-6 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
              >
                Count Inventory
              </Link>
            </div>

            {inventory.length === 0 ? (
              <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
                <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
                  No inventory tracked yet. Count inventory to get started.
                </p>
              </div>
            ) : (
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                          Current
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                          Par Level
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                          Needed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                          Last Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-ocean-sky/10 dark:hover:bg-ocean-deep/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-text dark:text-ocean-text-dark">
                            {item.warehouseItem.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                            {item.warehouseItem.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-ocean-text dark:text-ocean-text-dark">
                            {item.currentQty} {item.warehouseItem.unitOfMeasure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-ocean-text dark:text-ocean-text-dark">
                            {item.parLevel} {item.warehouseItem.unitOfMeasure}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                            item.needed > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {item.needed > 0 ? `${item.needed} ${item.warehouseItem.unitOfMeasure}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ocean-muted dark:text-ocean-muted-dark">
                            {item.lastCountDate ? new Date(item.lastCountDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <p className="text-ocean-muted dark:text-ocean-muted-dark mb-6">
              Order history for this customer
            </p>
            <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
              <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
                Order history coming soon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
