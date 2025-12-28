'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Threshold = {
  id: string;
  warehouseItemId: string;
  branchId: string | null;
  minLevel: number;
  parLevel: number;
  criticalLevel: number;
  reorderQty: number | null;
  status: 'OK' | 'BELOW_PAR' | 'BELOW_MIN' | 'CRITICAL';
  warehouseItem: {
    id: string;
    itemName: string;
    category: string;
    unit: string;
    currentQty: number;
    parLevel: number;
  };
  branch: {
    id: string;
    name: string;
  } | null;
};

type Branch = {
  id: string;
  name: string;
};

export default function ThresholdsPage() {
  const { data: session } = useSession();
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showBelowMin, setShowBelowMin] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<Threshold | null>(null);
  const [formData, setFormData] = useState({
    minLevel: '',
    parLevel: '',
    criticalLevel: '',
    reorderQty: '',
  });

  const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'WAREHOUSE';

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [selectedBranch, showBelowMin]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setBranches(data.branches || []);

      // Set default branch if user has one
      if (session?.user?.branchId) {
        setSelectedBranch(session.user.branchId);
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (showBelowMin) params.append('belowMin', 'true');

      const response = await fetch(`/api/thresholds?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setThresholds(data.thresholds);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setFormData({
      minLevel: String(threshold.minLevel),
      parLevel: String(threshold.parLevel),
      criticalLevel: String(threshold.criticalLevel),
      reorderQty: threshold.reorderQty ? String(threshold.reorderQty) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingThreshold(null);
    setError('');
  };

  const handleSave = async (threshold: Threshold) => {
    setError('');

    try {
      const response = await fetch('/api/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseItemId: threshold.warehouseItemId,
          branchId: threshold.branchId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await fetchThresholds();
      setEditingThreshold(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update threshold');
    }
  };

  const getStatusBadge = (status: string, currentQty: number, threshold: Threshold) => {
    const badges = {
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', label: 'CRITICAL' },
      BELOW_MIN: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Below Min' },
      BELOW_PAR: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Below Par' },
      OK: { bg: 'bg-green-100', text: 'text-green-800', label: 'OK' },
    };

    const badge = badges[status as keyof typeof badges] || badges.OK;

    return (
      <div>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
        <div className="text-xs text-gray-500 mt-1">
          {currentQty} / {threshold.parLevel}
        </div>
      </div>
    );
  };

  const getStockPercentage = (currentQty: number, parLevel: number) => {
    if (parLevel === 0) return 0;
    return Math.min((currentQty / parLevel) * 100, 100);
  };

  if (loading && thresholds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading thresholds...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const stats = {
    total: thresholds.length,
    critical: thresholds.filter(t => t.status === 'CRITICAL').length,
    belowMin: thresholds.filter(t => t.status === 'BELOW_MIN').length,
    belowPar: thresholds.filter(t => t.status === 'BELOW_PAR').length,
    ok: thresholds.filter(t => t.status === 'OK').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Thresholds</h1>
          <p className="text-gray-600 mt-1">Manage min/par/critical levels by branch</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Items</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-red-700">Critical</div>
            <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-orange-700">Below Min</div>
            <div className="text-2xl font-bold text-orange-900">{stats.belowMin}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-yellow-700">Below Par</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.belowPar}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-green-700">OK</div>
            <div className="text-2xl font-bold text-green-900">{stats.ok}</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={showBelowMin}
              onChange={(e) => setShowBelowMin(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show items below minimum only</span>
          </label>
        </div>

        {/* Thresholds Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current / Par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Critical
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {thresholds.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="px-6 py-4 text-center text-gray-500">
                      No thresholds found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  thresholds.map((threshold) => {
                    const isEditing = editingThreshold?.id === threshold.id;
                    const percentage = getStockPercentage(threshold.warehouseItem.currentQty, threshold.parLevel);

                    return (
                      <tr key={threshold.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {threshold.warehouseItem.itemName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {threshold.warehouseItem.category} • {threshold.warehouseItem.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {threshold.branch?.name || 'Company Default'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{threshold.warehouseItem.currentQty}</span>
                              <span>{threshold.parLevel}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  threshold.status === 'CRITICAL' ? 'bg-red-600' :
                                  threshold.status === 'BELOW_MIN' ? 'bg-orange-500' :
                                  threshold.status === 'BELOW_PAR' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={formData.criticalLevel}
                              onChange={(e) => setFormData({ ...formData, criticalLevel: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{threshold.criticalLevel}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={formData.minLevel}
                              onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{threshold.minLevel}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={formData.parLevel}
                              onChange={(e) => setFormData({ ...formData, parLevel: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{threshold.parLevel}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={formData.reorderQty}
                              onChange={(e) => setFormData({ ...formData, reorderQty: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{threshold.reorderQty || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(threshold.status, threshold.warehouseItem.currentQty, threshold)}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSave(threshold)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(threshold)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Threshold Levels</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Critical:</strong> Urgent reorder needed (typically 25% of par)</li>
            <li><strong>Min:</strong> Minimum acceptable level (typically 50% of par)</li>
            <li><strong>Par:</strong> Target stock level for normal operations</li>
            <li><strong>Reorder Qty:</strong> Suggested quantity to order when restocking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
