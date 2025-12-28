'use client';

import { useState } from 'react';

interface ScannedItem {
  id: string;
  itemName: string;
  sku: string | null;
  category: string;
  currentQty: number;
  parLevel: number;
  unit: string;
  branchId: string | null;
  branch: {
    id: string;
    name: string;
    city: string;
  } | null;
}

interface ScannedItemModalProps {
  item: ScannedItem;
  onClose: () => void;
  onAction: (action: 'adjust' | 'transfer', data: any) => Promise<void>;
}

export default function ScannedItemModal({ item, onClose, onAction }: ScannedItemModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'adjust' | 'transfer'>('details');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferVehicle, setTransferVehicle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdjust = async () => {
    if (adjustQty === 0) {
      alert('Please enter a quantity to adjust');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction('adjust', {
        itemId: item.id,
        quantity: adjustQty,
        reason: adjustReason || 'QR scan adjustment',
      });
      onClose();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      alert('Failed to adjust quantity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (transferQty <= 0) {
      alert('Please enter a valid quantity to transfer');
      return;
    }
    if (!transferVehicle) {
      alert('Please enter a vehicle number');
      return;
    }
    if (transferQty > item.currentQty) {
      alert('Transfer quantity cannot exceed current stock');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction('transfer', {
        itemId: item.id,
        quantity: transferQty,
        vehicleNumber: transferVehicle,
      });
      onClose();
    } catch (error) {
      console.error('Error transferring to vehicle:', error);
      alert('Failed to transfer to vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{item.itemName}</h2>
            {item.sku && (
              <p className="text-sm text-gray-400 mt-1">SKU: {item.sku}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'details'
                ? 'text-starlight border-b-2 border-starlight'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'adjust'
                ? 'text-starlight border-b-2 border-starlight'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Adjust Quantity
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'transfer'
                ? 'text-starlight border-b-2 border-starlight'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transfer to Vehicle
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Category</label>
                  <p className="text-white font-medium">{item.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Unit</label>
                  <p className="text-white font-medium">{item.unit}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Current Quantity</label>
                  <p className="text-white font-medium text-2xl">{item.currentQty}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Par Level</label>
                  <p className="text-white font-medium text-2xl">{item.parLevel}</p>
                </div>
                {item.branch && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400">Branch</label>
                    <p className="text-white font-medium">
                      {item.branch.name} - {item.branch.city}
                    </p>
                  </div>
                )}
              </div>

              {item.currentQty < item.parLevel && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-200 font-medium">⚠️ Below Par Level</p>
                  <p className="text-sm text-red-300 mt-1">
                    Restock needed: {item.parLevel - item.currentQty} {item.unit}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adjustment Amount
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Positive to add, negative to subtract
                </p>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="input w-full"
                  placeholder="e.g., +10 or -5"
                />
                <p className="text-sm text-gray-400 mt-2">
                  New quantity: <span className="text-white font-medium">{item.currentQty + adjustQty}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Physical count correction"
                />
              </div>

              <button
                onClick={handleAdjust}
                disabled={isSubmitting || adjustQty === 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adjusting...' : 'Adjust Quantity'}
              </button>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity to Transfer
                </label>
                <input
                  type="number"
                  min="1"
                  max={item.currentQty}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="input w-full"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Available: {item.currentQty} {item.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={transferVehicle}
                  onChange={(e) => setTransferVehicle(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., V-101"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={isSubmitting || transferQty <= 0 || !transferVehicle}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Transferring...' : 'Transfer to Vehicle'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
