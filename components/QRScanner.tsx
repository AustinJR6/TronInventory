'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onClose, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            scanner.stop().then(() => {
              onScan(decodedText);
            });
          },
          (errorMessage) => {
            // Error callback (usually just means no QR code detected yet)
            // Only log actual errors, not "No QR code found" messages
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('QR Scanner error:', errorMessage);
            }
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to start camera';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        console.error('Error starting QR scanner:', err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  const handleClose = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
            <p className="text-sm text-red-300 mt-2">
              Please ensure camera permissions are enabled and try again.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-300 mb-2">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}

        <div
          id="qr-reader"
          className="w-full rounded-lg overflow-hidden"
          style={{ minHeight: '300px' }}
        />

        {isScanning && (
          <div className="mt-4 text-center">
            <p className="text-green-400 text-sm">
              ● Camera active - Point at QR code
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
