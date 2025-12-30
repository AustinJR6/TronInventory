'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Delivery {
  id: string;
  deliveryNumber: string;
  scheduledDate: string;
  loadedAt: string | null;
  departedAt: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  status: string;
  driverNotes: string | null;
  signature: string | null;
  route: {
    id: string;
    name: string;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  };
  customerOrder: {
    id: string;
    orderNumber: string;
    customer: {
      id: string;
      businessName: string;
      contactName: string | null;
      phone: string | null;
      address: string;
      city: string | null;
      deliveryInstructions: string | null;
    };
    items: Array<{
      id: string;
      requestedQty: number;
      pulledQty: number | null;
      warehouseItem: {
        id: string;
        name: string;
        sku: string;
        unitOfMeasure: string;
      };
    }>;
  };
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [driverNotes, setDriverNotes] = useState('');
  const [signature, setSignature] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDelivery();
    }
  }, [params.id]);

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`/api/deliveries/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch delivery');
      const data = await res.json();
      setDelivery(data);
      setDriverNotes(data.driverNotes || '');
    } catch (error) {
      console.error('Error fetching delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!delivery) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/deliveries/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, driverNotes }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update status');
      }

      await fetchDelivery();
      alert(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleComplete = async () => {
    if (!delivery || !signatureCanvasRef.current) return;

    if (!confirm('Are you sure you want to mark this delivery as completed?')) return;

    const canvas = signatureCanvasRef.current;
    const signatureData = canvas.toDataURL();

    setUpdating(true);
    try {
      const res = await fetch(`/api/deliveries/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureData, driverNotes }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to complete delivery');
      }

      alert('Delivery completed successfully!');
      router.push('/dashboard/deliveries');
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      alert(error.message || 'Failed to complete delivery');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'IN_TRANSIT':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'ARRIVED':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'LOADED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading delivery...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <p className="text-ocean-text dark:text-ocean-text-dark text-xl mb-4">Delivery not found</p>
          <Link
            href="/dashboard/deliveries"
            className="text-ocean-accent dark:text-starlight hover:underline"
          >
            Back to Deliveries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/dashboard/deliveries"
          className="text-ocean-accent dark:text-starlight hover:underline mb-4 inline-block"
        >
          ← Back to Deliveries
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              {delivery.deliveryNumber}
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              Order {delivery.customerOrder.orderNumber}
            </p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeColor(
              delivery.status
            )}`}
          >
            {delivery.status.replace('_', ' ')}
          </span>
        </div>

        {/* Customer Information */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
            Customer Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Business Name</label>
              <p className="text-ocean-text dark:text-ocean-text-dark font-medium">
                {delivery.customerOrder.customer.businessName}
              </p>
            </div>
            <div>
              <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Contact</label>
              <p className="text-ocean-text dark:text-ocean-text-dark">
                {delivery.customerOrder.customer.contactName || '-'}
              </p>
              {delivery.customerOrder.customer.phone && (
                <p className="text-sm text-ocean-accent dark:text-starlight">
                  {delivery.customerOrder.customer.phone}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Delivery Address</label>
              <p className="text-ocean-text dark:text-ocean-text-dark">
                {delivery.customerOrder.customer.address}
                {delivery.customerOrder.customer.city && `, ${delivery.customerOrder.customer.city}`}
              </p>
            </div>
            {delivery.customerOrder.customer.deliveryInstructions && (
              <div className="md:col-span-2">
                <label className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Delivery Instructions</label>
                <p className="text-ocean-text dark:text-ocean-text-dark">
                  {delivery.customerOrder.customer.deliveryInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg border border-ocean-medium/20 dark:border-starlight/20 overflow-hidden mb-6">
          <div className="p-6 bg-ocean-light dark:bg-ocean-deep/50">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark">Order Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ocean-medium/20 dark:divide-starlight/20">
              <thead className="bg-white dark:bg-ocean-deep/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-ocean-text dark:text-ocean-text-dark uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-ocean-deep/30 divide-y divide-ocean-medium/10 dark:divide-starlight/10">
                {delivery.customerOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-ocean-text dark:text-ocean-text-dark">
                      {item.warehouseItem.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-ocean-muted dark:text-ocean-muted-dark">
                      {item.warehouseItem.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-ocean-text dark:text-ocean-text-dark font-medium">
                      {item.pulledQty || item.requestedQty} {item.warehouseItem.unitOfMeasure}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Notes */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
            Driver Notes
          </label>
          <textarea
            value={driverNotes}
            onChange={(e) => setDriverNotes(e.target.value)}
            rows={3}
            disabled={delivery.status === 'DELIVERED'}
            className="w-full px-4 py-2 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight disabled:opacity-50"
            placeholder="Add any notes about this delivery..."
          />
        </div>

        {/* Status Actions */}
        {delivery.status !== 'DELIVERED' && (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Update Status
            </h2>
            <div className="flex flex-wrap gap-3">
              {delivery.status === 'LOADED' && (
                <button
                  onClick={() => handleStatusUpdate('IN_TRANSIT')}
                  disabled={updating}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  Mark as On The Way
                </button>
              )}
              {delivery.status === 'IN_TRANSIT' && (
                <button
                  onClick={() => handleStatusUpdate('ARRIVED')}
                  disabled={updating}
                  className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  Mark as Arrived
                </button>
              )}
              {(delivery.status === 'ARRIVED' || delivery.status === 'IN_TRANSIT') && (
                <button
                  onClick={() => setShowSignaturePad(!showSignaturePad)}
                  className="px-6 py-3 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Complete Delivery
                </button>
              )}
            </div>
          </div>
        )}

        {/* Signature Pad */}
        {showSignaturePad && delivery.status !== 'DELIVERED' && (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Customer Signature
            </h2>
            <div className="bg-white dark:bg-ocean-deep/50 border-2 border-ocean-medium/30 dark:border-starlight/30 rounded-lg mb-4">
              <canvas
                ref={signatureCanvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={clearSignature}
                className="px-6 py-2 bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Clear
              </button>
              <button
                onClick={handleComplete}
                disabled={updating}
                className="px-8 py-3 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {updating ? 'Completing...' : 'Complete Delivery'}
              </button>
            </div>
          </div>
        )}

        {/* Delivery completed - show signature */}
        {delivery.status === 'DELIVERED' && delivery.signature && (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
            <h2 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Delivery Completed
            </h2>
            <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark mb-4">
              Delivered on {new Date(delivery.deliveredAt!).toLocaleString()}
            </p>
            <div className="bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-lg p-4">
              <img src={delivery.signature} alt="Customer Signature" className="max-w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
