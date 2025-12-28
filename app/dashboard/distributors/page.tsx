'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Distributor = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  orderingMethod: string | null;
  defaultLeadDays: number;
  notes: string | null;
  active: boolean;
  _count: {
    itemMappings: number;
    purchaseOrders: number;
  };
};

export default function DistributorsPage() {
  const { data: session } = useSession();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    orderingMethod: '',
    defaultLeadDays: '0',
    notes: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchDistributors();
  }, [showActiveOnly]);

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showActiveOnly) params.append('active', 'true');

      const response = await fetch(`/api/distributors?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDistributors(data.distributors);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch distributors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (distributor?: Distributor) => {
    if (distributor) {
      setEditingDistributor(distributor);
      setFormData({
        name: distributor.name,
        contactName: distributor.contactName || '',
        email: distributor.email || '',
        phone: distributor.phone || '',
        website: distributor.website || '',
        orderingMethod: distributor.orderingMethod || '',
        defaultLeadDays: String(distributor.defaultLeadDays),
        notes: distributor.notes || '',
      });
    } else {
      setEditingDistributor(null);
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        orderingMethod: '',
        defaultLeadDays: '0',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDistributor(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingDistributor
        ? `/api/distributors/${editingDistributor.id}`
        : '/api/distributors';
      const method = editingDistributor ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchDistributors();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save distributor');
    }
  };

  const handleToggleActive = async (distributor: Distributor) => {
    if (!confirm(`Are you sure you want to ${distributor.active ? 'deactivate' : 'activate'} ${distributor.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/distributors/${distributor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !distributor.active }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchDistributors();
    } catch (err: any) {
      setError(err.message || 'Failed to update distributor');
    }
  };

  const handleDelete = async (distributor: Distributor) => {
    if (!confirm(`Are you sure you want to delete ${distributor.name}? This will set it as inactive.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/distributors/${distributor.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchDistributors();
    } catch (err: any) {
      setError(err.message || 'Failed to delete distributor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading distributors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Distributors</h1>
            <p className="text-gray-600 mt-1">Manage your supplier relationships</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Distributor
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show active only</span>
          </label>
        </div>

        {/* Distributors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email / Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                    No distributors found. {isAdmin && 'Click "Add Distributor" to get started.'}
                  </td>
                </tr>
              ) : (
                distributors.map((distributor) => (
                  <tr key={distributor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{distributor.name}</div>
                      {distributor.website && (
                        <a
                          href={distributor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {distributor.contactName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{distributor.email || '-'}</div>
                      <div className="text-sm text-gray-500">{distributor.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {distributor.defaultLeadDays} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {distributor._count.itemMappings} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          distributor.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {distributor.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(distributor)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(distributor)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          {distributor.active ? 'Deactivate' : 'Activate'}
                        </button>
                        {distributor._count.purchaseOrders === 0 && (
                          <button
                            onClick={() => handleDelete(distributor)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDistributor ? 'Edit Distributor' : 'Add Distributor'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordering Method
                    </label>
                    <select
                      value={formData.orderingMethod}
                      onChange={(e) => setFormData({ ...formData, orderingMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="">Select...</option>
                      <option value="EMAIL">Email</option>
                      <option value="PORTAL">Online Portal</option>
                      <option value="PHONE">Phone</option>
                      <option value="EDI">EDI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Lead Time (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.defaultLeadDays}
                      onChange={(e) => setFormData({ ...formData, defaultLeadDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingDistributor ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
