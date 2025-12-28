'use client';

import { useEffect, useState } from 'react';

interface PartRequest {
  id: string;
  itemName: string;
  description: string | null;
  quantity: number;
  urgency: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  fulfilledAt: string | null;
  requester: {
    id: string;
    name: string;
    email: string;
    vehicleNumber: string | null;
  };
}

export default function PartRequestsPage() {
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    urgency: 'normal',
  });

  useEffect(() => {
    fetchPartRequests();
  }, []);

  const fetchPartRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/part-requests');
      const data = await response.json();
      setPartRequests(data.partRequests || []);
    } catch (error) {
      console.error('Error fetching part requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      const response = await fetch('/api/part-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewRequest({
          itemName: '',
          description: '',
          quantity: 1,
          urgency: 'normal',
        });
        fetchPartRequests();
        alert('Part request submitted successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to submit request'}`);
      }
    } catch (error) {
      console.error('Error submitting part request:', error);
      alert('Error submitting request');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      IN_PROGRESS: 'bg-blue-900/50 text-blue-300 border-blue-700',
      FULFILLED: 'bg-green-900/50 text-green-300 border-green-700',
      CANCELLED: 'bg-gray-700 text-gray-300 border-gray-600',
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      low: 'bg-gray-700 text-gray-300',
      normal: 'bg-blue-900/50 text-blue-300',
      high: 'bg-orange-900/50 text-orange-300',
      critical: 'bg-red-900/50 text-red-300',
    };
    return badges[urgency as keyof typeof badges] || badges.normal;
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading part requests...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Part Requests</h1>
          <p className="mt-2 text-gray-300">
            Request parts not in warehouse inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Part
        </button>
      </div>

      {partRequests.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No part requests yet</h3>
          <p className="mt-2 text-gray-400">
            Request a part to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {partRequests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{request.itemName}</h3>
                  {request.description && (
                    <p className="mt-1 text-sm text-gray-300">{request.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`badge ${getStatusBadge(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                  <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
                    {request.urgency.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Quantity:</span>
                  <span className="ml-2 text-white">{request.quantity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Requested:</span>
                  <span className="ml-2 text-white">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.notes && (
                <div className="mt-3 p-3 bg-tron-black/50 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Notes from warehouse:</p>
                  <p className="text-sm text-gray-300">{request.notes}</p>
                </div>
              )}

              {request.fulfilledAt && (
                <div className="mt-2 text-xs text-green-400">
                  Fulfilled on {new Date(request.fulfilledAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-ocean-dark rounded-lg shadow-xl max-w-md w-full p-6 border border-starlight/30">
            <h2 className="text-2xl font-bold text-white mb-4">Request Part</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newRequest.itemName}
                  onChange={(e) => setNewRequest({ ...newRequest, itemName: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Special Junction Box"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="input-field"
                  placeholder="Provide details about the part you need..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
                  className="input-field"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Urgency
                </label>
                <select
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                  className="input-field"
                >
                  <option value="low">Low - Can wait a week</option>
                  <option value="normal">Normal - Needed this week</option>
                  <option value="high">High - Needed tomorrow</option>
                  <option value="critical">Critical - Needed today</option>
                </select>
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
                onClick={handleSubmitRequest}
                className="btn-primary flex-1"
                disabled={!newRequest.itemName}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
