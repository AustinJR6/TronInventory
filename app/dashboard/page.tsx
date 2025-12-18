import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const role = session.user.role;

  // Get stats based on role
  let stats = {
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    activeUsers: 0,
  };

  if (role === 'ADMIN' || role === 'WAREHOUSE') {
    const [totalOrders, pendingOrders, allWarehouseItems, activeUsers] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
      prisma.warehouseInventory.findMany({ select: { currentQty: true, parLevel: true } }),
      role === 'ADMIN' ? prisma.user.count({ where: { active: true } }) : 0,
    ]);
    const lowStockItems = allWarehouseItems.filter(item => item.currentQty < item.parLevel).length;
    stats = { totalOrders, pendingOrders, lowStockItems, activeUsers };
  } else if (role === 'FIELD') {
    const [totalOrders, pendingOrders] = await Promise.all([
      prisma.order.count({ where: { userId: session.user.id } }),
      prisma.order.count({ where: { userId: session.user.id, status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
    ]);
    stats.totalOrders = totalOrders;
    stats.pendingOrders = pendingOrders;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-2 text-gray-300">
          {role === 'ADMIN' && 'Manage your warehouse, orders, and users from here.'}
          {role === 'WAREHOUSE' && 'Manage warehouse inventory and fulfill orders.'}
          {role === 'FIELD' && 'Submit orders and manage your vehicle inventory.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(role === 'ADMIN' || role === 'WAREHOUSE' || role === 'FIELD') && (
          <>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400">Total Orders</h3>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalOrders}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400">Pending Orders</h3>
              <p className="mt-2 text-3xl font-bold text-tron-orange">{stats.pendingOrders}</p>
            </div>
          </>
        )}
        {(role === 'ADMIN' || role === 'WAREHOUSE') && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400">Low Stock Items</h3>
            <p className="mt-2 text-3xl font-bold text-red-400">{stats.lowStockItems}</p>
          </div>
        )}
        {role === 'ADMIN' && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400">Active Users</h3>
            <p className="mt-2 text-3xl font-bold text-white">{stats.activeUsers}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {role === 'FIELD' && (
          <>
            <Link href="/dashboard/new-order" className="card hover:shadow-lg transition-shadow cursor-pointer hover:border-tron-orange">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-tron-orange text-white p-3 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Submit New Order</h3>
                  <p className="text-sm text-gray-400">Request materials from the warehouse</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/vehicle-stock" className="card hover:shadow-lg transition-shadow cursor-pointer hover:border-tron-orange">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 text-white p-3 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Update Vehicle Stock</h3>
                  <p className="text-sm text-gray-400">Weekly vehicle inventory check</p>
                </div>
              </div>
            </Link>
          </>
        )}
        {(role === 'ADMIN' || role === 'WAREHOUSE') && (
          <>
            <Link href="/dashboard/orders" className="card hover:shadow-lg transition-shadow cursor-pointer hover:border-tron-orange">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-tron-orange text-white p-3 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Manage Orders</h3>
                  <p className="text-sm text-gray-400">View and process orders</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/warehouse" className="card hover:shadow-lg transition-shadow cursor-pointer hover:border-tron-orange">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 text-white p-3 rounded-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Warehouse Inventory</h3>
                  <p className="text-sm text-gray-400">Manage stock levels</p>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
