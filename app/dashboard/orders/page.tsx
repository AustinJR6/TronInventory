'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  notes: string | null;
  vehicleNumber: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: {
    id: string;
    requestedQty: number;
    pulledQty: number;
    warehouseItem: {
      id: string;
      itemName: string;
      unit: string;
      currentQty: number;
    };
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [pulledQuantities, setPulledQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = selectedStatus
        ? `/api/orders?status=${selectedStatus}`
        : '/api/orders';
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handlePullItems = async (order: Order) => {
    const itemUpdates = order.items.map((item) => ({
      itemId: item.id,
      warehouseItemId: item.warehouseItem.id,
      pulledQty: pulledQuantities[item.id] || item.requestedQty,
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: 'READY',
          itemUpdates,
        }),
      });

      if (response.ok) {
        setPulledQuantities({});
        setExpandedOrder(null);
        fetchOrders();
        alert('Items pulled successfully and order marked as ready!');
      }
    } catch (error) {
      console.error('Error pulling items:', error);
      alert('Error processing order');
    }
  };

  const setPulledQty = (itemId: string, qty: number) => {
    setPulledQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      SUBMITTED: 'badge-submitted',
      IN_PROGRESS: 'badge-in-progress',
      READY: 'badge-ready',
      COMPLETED: 'badge-completed',
    };
    return badges[status as keyof typeof badges] || 'badge';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="mt-2 text-gray-600">Process and fulfill field worker orders</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === ''
              ? 'bg-tron-red text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Orders
        </button>
        {['SUBMITTED', 'IN_PROGRESS', 'READY', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-tron-red text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.user.name} - Vehicle {order.vehicleNumber}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {order.orderType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Requested
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Available
                      </th>
                      {expandedOrder === order.id && order.status === 'SUBMITTED' && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Pull Qty
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.warehouseItem.itemName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {item.requestedQty} {item.warehouseItem.unit}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <span
                            className={
                              item.warehouseItem.currentQty < item.requestedQty
                                ? 'text-red-600 font-medium'
                                : 'text-green-600'
                            }
                          >
                            {item.warehouseItem.currentQty} {item.warehouseItem.unit}
                          </span>
                        </td>
                        {expandedOrder === order.id && order.status === 'SUBMITTED' && (
                          <td className="px-4 py-2 text-sm">
                            <input
                              type="number"
                              min="0"
                              max={Math.min(item.requestedQty, item.warehouseItem.currentQty)}
                              defaultValue={item.requestedQty}
                              onChange={(e) => setPulledQty(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-tron-red"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                {order.status === 'SUBMITTED' && (
                  <>
                    {expandedOrder === order.id ? (
                      <>
                        <button
                          onClick={() => setExpandedOrder(null)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePullItems(order)}
                          className="btn-primary"
                        >
                          Complete Pull & Mark Ready
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => setExpandedOrder(order.id)}
                          className="btn-primary"
                        >
                          Pull Items
                        </button>
                      </>
                    )}
                  </>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => setExpandedOrder(order.id)}
                    className="btn-primary"
                  >
                    Pull Items
                  </button>
                )}
                {order.status === 'READY' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
