'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string | null;
  active: boolean;
  createdAt: string;
}

interface BranchData {
  branches: Branch[];
  branchLimit: number;
  currentCount: number;
  canAddMore: boolean;
}

export default function BranchesPage() {
  const [branchData, setBranchData] = useState<BranchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState({
    name: '',
    city: '',
    address: '',
    duplicateFromBranchId: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranchData(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddModal(false);
        setNewBranch({
          name: '',
          city: '',
          address: '',
          duplicateFromBranchId: '',
        });
        fetchBranches();
        alert(
          `Branch created successfully!${
            data.duplicatedItems ? ' Inventory items have been duplicated from the source branch.' : ''
          }`
        );
      } else {
        alert(`Error: ${data.error || 'Failed to create branch'}`);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error creating branch');
    }
  };

  const handleEditBranch = async () => {
    if (!editingBranch) return;

    try {
      const response = await fetch('/api/branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: editingBranch.id,
          name: editingBranch.name,
          city: editingBranch.city,
          address: editingBranch.address,
          active: editingBranch.active,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingBranch(null);
        fetchBranches();
        alert('Branch updated successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update branch'}`);
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Error updating branch');
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch({ ...branch });
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading branches...</div>;
  }

  if (!branchData) {
    return <div className="text-center py-8 text-white">Error loading branches</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Branch Management</h1>
          <p className="mt-2 text-gray-300">
            Manage your company's branch locations
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {branchData.currentCount} of {branchData.branchLimit} branches used
            {!branchData.canAddMore && ' (limit reached)'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!branchData.canAddMore}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !branchData.canAddMore
              ? 'Branch limit reached. Upgrade your license to add more branches.'
              : ''
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Branch
        </button>
      </div>

      {!branchData.canAddMore && (
        <div className="mb-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-500 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-yellow-300 font-medium">Branch Limit Reached</h3>
              <p className="mt-1 text-sm text-yellow-200">
                You've reached your branch limit. Upgrade your license to add more branches.
              </p>
              <Link
                href="/dashboard/upgrade"
                className="mt-2 inline-block text-sm text-yellow-300 hover:text-yellow-200 underline"
              >
                View Upgrade Options →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branchData.branches.map((branch) => (
          <div
            key={branch.id}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openEditModal(branch)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{branch.name}</h3>
                <p className="text-sm text-gray-400">{branch.city}</p>
              </div>
              <span
                className={`badge ${
                  branch.active
                    ? 'bg-green-900/50 text-green-300 border-green-700'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {branch.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {branch.address && (
              <p className="text-sm text-gray-300 mb-2">{branch.address}</p>
            )}
            <p className="text-xs text-gray-500">
              Created: {new Date(branch.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-tron-gray rounded-lg shadow-xl max-w-md w-full p-6 border border-tron-orange/30">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Branch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Kansas City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Kansas City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duplicate Inventory From (Optional)
                </label>
                <select
                  value={newBranch.duplicateFromBranchId}
                  onChange={(e) =>
                    setNewBranch({ ...newBranch, duplicateFromBranchId: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">None - Start with empty inventory</option>
                  {branchData.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  This will copy all warehouse items from the selected branch (starting with 0 quantity)
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBranch}
                className="btn-primary flex-1"
                disabled={!newBranch.name || !newBranch.city}
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-tron-gray rounded-lg shadow-xl max-w-md w-full p-6 border border-tron-orange/30">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Branch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, name: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={editingBranch.city}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, city: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, address: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingBranch.active}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, active: e.target.checked })
                  }
                  className="w-4 h-4 text-tron-orange bg-tron-black border-tron-orange/30 rounded focus:ring-tron-orange"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-300">
                  Branch is active
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBranch(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBranch}
                className="btn-primary flex-1"
                disabled={!editingBranch.name || !editingBranch.city}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
