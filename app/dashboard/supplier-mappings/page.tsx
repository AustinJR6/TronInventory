'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type SupplierMapping = {
  id: string;
  warehouseItemId: string;
  distributorId: string;
  supplierSKU: string | null;
  packSize: number;
  unitCost: number;
  moq: number;
  preferredSupplier: boolean;
  leadTimeDays: number | null;
  notes: string | null;
  active: boolean;
  warehouseItem: {
    id: string;
    itemName: string;
    category: string;
    unit: string;
    parLevel: number;
  };
  distributor: {
    id: string;
    name: string;
    defaultLeadDays: number;
    active: boolean;
  };
};

type Distributor = {
  id: string;
  name: string;
  active: boolean;
};

type WarehouseItem = {
  id: string;
  itemName: string;
  category: string;
  unit: string;
};

export default function SupplierMappingsPage() {
  const { data: session } = useSession();
  const [mappings, setMappings] = useState<SupplierMapping[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterPreferredOnly, setFilterPreferredOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<SupplierMapping | null>(null);
  const [formData, setFormData] = useState({
    warehouseItemId: '',
    distributorId: '',
    supplierSKU: '',
    packSize: '1',
    unitCost: '',
    moq: '1',
    preferredSupplier: false,
    leadTimeDays: '',
    notes: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';
  const canEdit = isAdmin || session?.user?.role === 'WAREHOUSE';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [filterDistributor, filterPreferredOnly]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mappingsRes, distributorsRes, itemsRes] = await Promise.all([
        fetch('/api/supplier-mappings'),
        fetch('/api/distributors?active=true'),
        fetch('/api/inventory'),
      ]);

      const [mappingsData, distributorsData, itemsData] = await Promise.all([
        mappingsRes.json(),
        distributorsRes.json(),
        itemsRes.json(),
      ]);

      if (!mappingsRes.ok) throw new Error(mappingsData.error);
      if (!distributorsRes.ok) throw new Error(distributorsData.error);
      if (!itemsRes.ok) throw new Error(itemsData.error);

      setMappings(mappingsData.mappings);
      setDistributors(distributorsData.distributors);
      setWarehouseItems(itemsData.inventory || itemsData.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDistributor) params.append('distributorId', filterDistributor);
      if (filterPreferredOnly) params.append('preferredOnly', 'true');

      const response = await fetch(`/api/supplier-mappings?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMappings(data.mappings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mappings');
    }
  };

  const handleOpenModal = (mapping?: SupplierMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        warehouseItemId: mapping.warehouseItemId,
        distributorId: mapping.distributorId,
        supplierSKU: mapping.supplierSKU || '',
        packSize: String(mapping.packSize),
        unitCost: String(mapping.unitCost),
        moq: String(mapping.moq),
        preferredSupplier: mapping.preferredSupplier,
        leadTimeDays: mapping.leadTimeDays ? String(mapping.leadTimeDays) : '',
        notes: mapping.notes || '',
      });
    } else {
      setEditingMapping(null);
      setFormData({
        warehouseItemId: '',
        distributorId: '',
        supplierSKU: '',
        packSize: '1',
        unitCost: '',
        moq: '1',
        preferredSupplier: false,
        leadTimeDays: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMapping(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingMapping
        ? `/api/supplier-mappings/${editingMapping.id}`
        : '/api/supplier-mappings';
      const method = editingMapping ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchMappings();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save mapping');
    }
  };

  const handleDelete = async (mapping: SupplierMapping) => {
    if (!confirm(`Are you sure you want to delete the mapping for ${mapping.warehouseItem.itemName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/supplier-mappings/${mapping.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchMappings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete mapping');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading supplier mappings...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Supplier Item Mappings</h1>
            <p className="text-gray-600 mt-1">Map warehouse items to distributor pricing</p>
          </div>
          {canEdit && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Mapping
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Distributor
            </label>
            <select
              value={filterDistributor}
              onChange={(e) => setFilterDistributor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Distributors</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={filterPreferredOnly}
              onChange={(e) => setFilterPreferredOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Preferred suppliers only</span>
          </label>
        </div>

        {/* Mappings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distributor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pack Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MOQ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preferred
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="px-6 py-4 text-center text-gray-500">
                    No mappings found. {canEdit && 'Click "Add Mapping" to get started.'}
                  </td>
                </tr>
              ) : (
                mappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {mapping.warehouseItem.itemName}
                      </div>
                      <div className="text-xs text-gray-500">{mapping.warehouseItem.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mapping.distributor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.supplierSKU || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.packSize} {mapping.warehouseItem.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${Number(mapping.unitCost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.moq} packs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.leadTimeDays || mapping.distributor.defaultLeadDays} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mapping.preferredSupplier && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Preferred
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(mapping)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(mapping)}
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
                  {editingMapping ? 'Edit Mapping' : 'Add Supplier Mapping'}
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
                      Warehouse Item *
                    </label>
                    <select
                      required
                      disabled={!!editingMapping}
                      value={formData.warehouseItemId}
                      onChange={(e) => setFormData({ ...formData, warehouseItemId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="">Select an item...</option>
                      {warehouseItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.itemName} ({item.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distributor *
                    </label>
                    <select
                      required
                      disabled={!!editingMapping}
                      value={formData.distributorId}
                      onChange={(e) => setFormData({ ...formData, distributorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="">Select a distributor...</option>
                      {distributors.filter(d => d.active).map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier SKU
                    </label>
                    <input
                      type="text"
                      value={formData.supplierSKU}
                      onChange={(e) => setFormData({ ...formData, supplierSKU: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pack Size *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.packSize}
                      onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost ($) *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Quantity (packs) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      placeholder="Uses distributor default if empty"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.preferredSupplier}
                        onChange={(e) => setFormData({ ...formData, preferredSupplier: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Set as preferred supplier for this item
                      </span>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
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
                    {editingMapping ? 'Update' : 'Create'}
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
