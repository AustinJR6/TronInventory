'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  parLevel: number;
  currentQty: number;
  unit: string;
  branchId: string | null;
  branch?: {
    id: string;
    name: string;
    city: string;
  };
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function WarehousePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: '',
    parLevel: 0,
    currentQty: 0,
    unit: '',
    branchId: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBranch) params.append('branchId', selectedBranch);

      const url = params.toString() ? `/api/inventory?${params}` : '/api/inventory';
      const response = await fetch(url);
      const data = await response.json();
      setInventory(data.inventory);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValue(item.currentQty);
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, currentQty: editValue }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setInventory((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewItem({
          itemName: '',
          category: '',
          parLevel: 0,
          currentQty: 0,
          unit: '',
          branchId: '',
        });
        fetchInventory();
        alert('Item added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add item'}`);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentQty / item.parLevel) * 100;
    if (percentage <= 25) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
    if (percentage <= 50) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Low' };
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Good' };
  };

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Warehouse Inventory</h1>
          <p className="mt-2 text-gray-300">Manage and track warehouse stock levels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Item
        </button>
      </div>

      <div className="mb-6 space-y-4">
        {/* Branch Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">Branch:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBranch('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedBranch === ''
                  ? 'bg-tron-orange text-white'
                  : 'bg-tron-gray text-gray-300 border border-tron-orange/30 hover:bg-tron-gray-light'
              }`}
            >
              All Branches
            </button>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedBranch === branch.id
                    ? 'bg-tron-orange text-white'
                    : 'bg-tron-gray text-gray-300 border border-tron-orange/30 hover:bg-tron-gray-light'
                }`}
              >
                {branch.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">Category:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-tron-orange text-white'
                  : 'bg-tron-gray text-gray-300 border border-tron-orange/30 hover:bg-tron-gray-light'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-tron-orange text-white'
                    : 'bg-tron-gray text-gray-300 border border-tron-orange/30 hover:bg-tron-gray-light'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tron-orange/20">
            <thead className="bg-tron-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Par Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Current Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tron-orange uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-tron-gray divide-y divide-tron-orange/20">
              {inventory.map((item) => {
                const status = getStockStatus(item);
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-tron-gray-light">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {item.parLevel} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value))}
                          className="w-24 px-2 py-1 border border-tron-orange/30 rounded-md focus:ring-2 focus:ring-tron-orange focus:border-transparent bg-tron-black text-white"
                          min="0"
                        />
                      ) : (
                        `${item.currentQty} ${item.unit}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-tron-orange hover:text-tron-orange-light"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-tron-gray rounded-lg shadow-xl max-w-md w-full p-6 border border-tron-orange/30">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="input-field"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Branch
                </label>
                <select
                  value={newItem.branchId}
                  onChange={(e) => setNewItem({ ...newItem, branchId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select a branch...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Wire, Panels, Tools"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="input-field"
                  placeholder="e.g., ft, pcs, boxes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Par Level
                  </label>
                  <input
                    type="number"
                    value={newItem.parLevel}
                    onChange={(e) => setNewItem({ ...newItem, parLevel: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Current Qty
                  </label>
                  <input
                    type="number"
                    value={newItem.currentQty}
                    onChange={(e) => setNewItem({ ...newItem, currentQty: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                    placeholder="0"
                  />
                </div>
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
                onClick={handleAddItem}
                className="btn-primary flex-1"
                disabled={!newItem.itemName || !newItem.category || !newItem.unit || !newItem.branchId}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
