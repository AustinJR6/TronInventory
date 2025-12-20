'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
const ScannedItemModal = dynamic(() => import('@/components/ScannedItemModal'), { ssr: false });

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

export default function QuickScanButton() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);

  const handleScan = async (qrData: string) => {
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
      setShowScanner(false);
      setScannedItem(data.item);
    } catch (error) {
      console.error('Error processing QR scan:', error);
      alert('Failed to process QR code');
      setShowScanner(false);
    }
  };

  const handleItemAction = async (action: 'adjust' | 'transfer', actionData: any) => {
    if (action === 'adjust') {
      // Calculate new quantity
      const newQty = (scannedItem?.currentQty || 0) + actionData.quantity;

      try {
        const response = await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: actionData.itemId,
            currentQty: newQty,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update quantity');
        }

        alert('Quantity updated successfully!');
        setScannedItem(null);
      } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Failed to update inventory');
      }
    } else if (action === 'transfer') {
      alert('Transfer to vehicle functionality coming soon');
      setScannedItem(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
        Quick Scan QR Code
      </button>

      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          onError={(error) => {
            console.error('Scanner error:', error);
            alert(`Scanner error: ${error}`);
          }}
        />
      )}

      {scannedItem && (
        <ScannedItemModal
          item={scannedItem}
          onClose={() => setScannedItem(null)}
          onAction={handleItemAction}
        />
      )}
    </>
  );
}
