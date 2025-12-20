'use client';

import { useState, useEffect } from 'react';

interface EditItemModalProps {
  item: {
    id: string;
    itemName: string;
    category: string;
    parLevel: number;
    currentQty: number;
    unit: string;
    sku?: string | null;
    qrCodeData?: string | null;
    branchId: string | null;
  };
  branches: Array<{ id: string; name: string; city: string }>;
  userRole: string;
  onClose: () => void;
  onSave: (itemId: string, updates: any) => Promise<void>;
  onGenerateQR: (itemId: string) => Promise<void>;
}

export default function EditItemModal({
  item,
  branches,
  userRole,
  onClose,
  onSave,
  onGenerateQR,
}: EditItemModalProps) {
  const [formData, setFormData] = useState({
    itemName: item.itemName,
    category: item.category,
    parLevel: item.parLevel,
    currentQty: item.currentQty,
    unit: item.unit,
    sku: item.sku || '',
    branchId: item.branchId || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(item.id, formData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!formData.sku) {
      alert('Please add an SKU before generating a QR code');
      return;
    }

    // Save the SKU first if it changed
    if (formData.sku !== item.sku) {
      setIsSaving(true);
      try {
        await onSave(item.id, { sku: formData.sku });
      } catch (error) {
        console.error('Error saving SKU:', error);
        alert('Failed to save SKU');
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    setIsGenerating(true);
    try {
      await onGenerateQR(item.id);
      alert('QR code generated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      alert(error.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!item.qrCodeData) return;

    const link = document.createElement('a');
    link.href = item.qrCodeData;
    link.download = `qr-${item.sku || item.itemName}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Par Level *
              </label>
              <input
                type="number"
                min="0"
                value={formData.parLevel}
                onChange={(e) =>
                  setFormData({ ...formData, parLevel: parseInt(e.target.value) || 0 })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={formData.currentQty}
                onChange={(e) =>
                  setFormData({ ...formData, currentQty: parseInt(e.target.value) || 0 })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input w-full"
                placeholder="e.g., ea, box, ft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Branch *
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="input w-full"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SKU and QR Code Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">SKU & QR Code</h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., PANEL-300W-001"
                />
                <p className="text-xs text-gray-400 mt-1">
                  SKU is required to generate a QR code
                </p>
              </div>

              <div>
                {item.qrCodeData ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      QR Code
                    </label>
                    <img
                      src={item.qrCodeData}
                      alt="QR Code"
                      className="w-32 h-32 border-2 border-gray-600 rounded"
                    />
                    <button
                      onClick={handleDownloadQR}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Download QR Code
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end h-full">
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={handleGenerateQR}
                        disabled={!formData.sku || isGenerating}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? 'Generating...' : 'Generate QR Code'}
                      </button>
                    )}
                    {userRole !== 'ADMIN' && (
                      <p className="text-sm text-gray-400">
                        Only admins can generate QR codes
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              !formData.itemName ||
              !formData.category ||
              !formData.unit ||
              !formData.branchId
            }
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
