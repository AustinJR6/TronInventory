'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
const ScannedItemModal = dynamic(() => import('@/components/ScannedItemModal'), { ssr: false });
const EditItemModal = dynamic(() => import('@/components/EditItemModal'), { ssr: false });

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  parLevel: number;
  currentQty: number;
  unit: string;
  branchId: string | null;
  sku: string | null;
  qrCodeData: string | null;
  branch: {
    id: string;
    name: string;
    city: string;
  } | null;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function WarehousePage() {
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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

  const handleQRScan = async (qrData: string) => {
    try {
      const response = await fetch('/api/qr-code/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to process QR code');
        setShowScanner(false);
        return;
      }

      const data = await response.json();
      setScannedItem(data.item);
      setShowScanner(false);
    } catch (error) {
      console.error('Error processing QR scan:', error);
      alert('Failed to process QR code');
      setShowScanner(false);
    }
  };

  const handleScannedItemAction = async (action: 'adjust' | 'transfer', actionData: any) => {
    if (action === 'adjust') {
      // Get the current item to calculate new quantity
      const currentItem = inventory.find((item) => item.id === actionData.itemId);
      if (!currentItem) {
        alert('Item not found');
        setScannedItem(null);
        return;
      }

      const newQty = currentItem.currentQty + actionData.quantity;

      try {
        const response = await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: actionData.itemId,
            currentQty: newQty
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update quantity');
        }

        await fetchInventory();
      } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Failed to update inventory');
      }
    } else if (action === 'transfer') {
      // Transfer to vehicle - we'll need to implement this
      alert('Transfer to vehicle functionality coming soon');
    }
    setScannedItem(null);
  };

  const handleSaveItem = async (itemId: string, updates: any) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      await fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  const handleGenerateQR = async (itemId: string) => {
    try {
      const response = await fetch('/api/qr-code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR code');
      }

      await fetchInventory();
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw error;
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Quick edit quantity"
                          >
                            Quick Edit
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-tron-orange hover:text-tron-orange-light"
                            title="Edit item details & QR"
                          >
                            Details
                          </button>
                        </div>
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
          onError={(error) => {
            console.error('Scanner error:', error);
            alert(`Scanner error: ${error}`);
          }}
        />
      )}

      {/* Scanned Item Action Modal */}
      {scannedItem && (
        <ScannedItemModal
          item={scannedItem}
          onClose={() => setScannedItem(null)}
          onAction={handleScannedItemAction}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          branches={branches}
          userRole={session?.user?.role || 'FIELD'}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
          onGenerateQR={handleGenerateQR}
        />
      )}
    </div>
  );
}
