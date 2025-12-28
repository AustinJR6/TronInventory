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

export default function ManagePartRequestsPage() {
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PartRequest | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    fetchPartRequests();
  }, [statusFilter]);

  const fetchPartRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/part-requests?status=${statusFilter}`
        : '/api/part-requests';
      const response = await fetch(url);
      const data = await response.json();
      setPartRequests(data.partRequests || []);
    } catch (error) {
      console.error('Error fetching part requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch('/api/part-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: updateData.status || selectedRequest.status,
          notes: updateData.notes || selectedRequest.notes,
        }),
      });

      if (response.ok) {
        setShowUpdateModal(false);
        setSelectedRequest(null);
        setUpdateData({ status: '', notes: '' });
        fetchPartRequests();
        alert('Part request updated successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update request'}`);
      }
    } catch (error) {
      console.error('Error updating part request:', error);
      alert('Error updating request');
    }
  };

  const openUpdateModal = (request: PartRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      notes: request.notes || '',
    });
    setShowUpdateModal(true);
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

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'text-gray-400',
      normal: 'text-blue-400',
      high: 'text-orange-400',
      critical: 'text-red-400',
    };
    return colors[urgency as keyof typeof colors] || colors.normal;
  };

  const statusCounts = {
    all: partRequests.length,
    PENDING: partRequests.filter(r => r.status === 'PENDING').length,
    IN_PROGRESS: partRequests.filter(r => r.status === 'IN_PROGRESS').length,
    FULFILLED: partRequests.filter(r => r.status === 'FULFILLED').length,
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading part requests...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Part Requests</h1>
        <p className="mt-2 text-gray-300">
          Review and fulfill part requests from field workers
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-starlight text-white'
              : 'bg-ocean-dark text-gray-300 border border-starlight/30 hover:bg-ocean-deep'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'PENDING'
              ? 'bg-yellow-600 text-white'
              : 'bg-ocean-dark text-gray-300 border border-yellow-700/30 hover:bg-ocean-deep'
          }`}
        >
          Pending ({statusCounts.PENDING})
        </button>
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white'
              : 'bg-ocean-dark text-gray-300 border border-blue-700/30 hover:bg-ocean-deep'
          }`}
        >
          In Progress ({statusCounts.IN_PROGRESS})
        </button>
        <button
          onClick={() => setStatusFilter('FULFILLED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'FULFILLED'
              ? 'bg-green-600 text-white'
              : 'bg-ocean-dark text-gray-300 border border-green-700/30 hover:bg-ocean-deep'
          }`}
        >
          Fulfilled ({statusCounts.FULFILLED})
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No part requests found</h3>
          <p className="mt-2 text-gray-400">
            {statusFilter ? `No ${statusFilter.toLowerCase()} requests` : 'No requests yet'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-tron-orange/20">
              <thead className="bg-tron-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-ocean-dark divide-y divide-tron-orange/20">
                {partRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-ocean-deep">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{request.itemName}</div>
                      {request.description && (
                        <div className="text-xs text-gray-400 mt-1">{request.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{request.requester.name}</div>
                      {request.requester.vehicleNumber && (
                        <div className="text-xs text-gray-400">Vehicle {request.requester.vehicleNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openUpdateModal(request)}
                        className="text-starlight hover:text-starlight-light"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Request Modal */}
      {showUpdateModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-ocean-dark rounded-lg shadow-xl max-w-md w-full p-6 border border-starlight/30">
            <h2 className="text-2xl font-bold text-white mb-4">Update Part Request</h2>

            <div className="mb-4 p-3 bg-tron-black/50 rounded-md">
              <div className="text-sm text-gray-400">Requested by:</div>
              <div className="text-white font-medium">{selectedRequest.requester.name}</div>
              {selectedRequest.requester.vehicleNumber && (
                <div className="text-sm text-gray-400">Vehicle {selectedRequest.requester.vehicleNumber}</div>
              )}
              <div className="mt-2 text-white font-medium">{selectedRequest.itemName}</div>
              {selectedRequest.description && (
                <div className="text-sm text-gray-300 mt-1">{selectedRequest.description}</div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Notes (visible to requester)
                </label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  className="input-field"
                  placeholder="Add notes about this request..."
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedRequest(null);
                  setUpdateData({ status: '', notes: '' });
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRequest}
                className="btn-primary flex-1"
              >
                Update Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
