'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Route {
  id: string;
  name: string;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryInstructions: '',
    routeId: '',
    salesRepId: '',
    creditLimit: '',
    paymentTerms: '',
  });

  useEffect(() => {
    fetchRoutes();
    fetchSalesReps();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes');
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const res = await fetch('/api/users?role=SALES_REP');
      if (!res.ok) throw new Error('Failed to fetch sales reps');
      const data = await res.json();
      setSalesReps(data);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      const customer = await res.json();
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      alert(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/customers"
          className="text-ocean-accent dark:text-starlight hover:underline mb-4 inline-block"
        >
          ← Back to Customers
        </Link>

        <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
          Add New Customer
        </h1>
        <p className="text-ocean-muted dark:text-ocean-muted-dark mb-8">
          Create a new customer account
        </p>

        <form onSubmit={handleSubmit}>
          {/* Business Information */}
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Business Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="ABC Bar & Grill"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="contact@business.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Address
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="Springfield"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="IL"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="62701"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Delivery Instructions
                </label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="Delivery door in back alley. Ring bell twice."
                />
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Account Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Route
                </label>
                <select
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                >
                  <option value="">Select route...</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Sales Representative
                </label>
                <select
                  name="salesRepId"
                  value={formData.salesRepId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                >
                  <option value="">Select sales rep...</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Credit Limit
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="5000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
                  placeholder="Net 30"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/customers"
              className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
