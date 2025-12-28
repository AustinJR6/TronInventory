import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import Link from 'next/link';
import QuickScanButton from '@/components/QuickScanButton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  // Enforce authentication and get scoped context
  const { companyId } = await enforceAll(session);
  const scopedPrisma = withCompanyScope(companyId);

  const role = session.user.role;
  const userBranchId = session.user.branchId;

  // Get stats based on role
  let stats = {
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    activeUsers: 0,
    branchName: '',
  };

  // Get user's branch info if available
  if (userBranchId) {
    const branch = await scopedPrisma.branch.findUnique({
      where: { id: userBranchId },
      select: { name: true },
    });
    stats.branchName = branch?.name || '';
  }

  if (role === 'ADMIN' || role === 'WAREHOUSE') {
    // For warehouse workers, filter by their branch; admins see all branches
    const branchFilter = role === 'WAREHOUSE' && userBranchId ? { branchId: userBranchId } : {};

    const [totalOrders, pendingOrders, allWarehouseItems, activeUsers] = await Promise.all([
      scopedPrisma.order.count({ where: branchFilter }),
      scopedPrisma.order.count({ where: { ...branchFilter, status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
      scopedPrisma.warehouseInventory.findMany({
        where: branchFilter,
        select: { currentQty: true, parLevel: true }
      }),
      role === 'ADMIN' ? scopedPrisma.user.count({ where: { active: true } }) : 0,
    ]);
    const lowStockItems = allWarehouseItems.filter((item: { currentQty: number; parLevel: number }) => item.currentQty < item.parLevel).length;
    stats = { ...stats, totalOrders, pendingOrders, lowStockItems, activeUsers };
  } else if (role === 'FIELD') {
    const [totalOrders, pendingOrders] = await Promise.all([
      scopedPrisma.order.count({ where: { userId: session.user.id } }),
      scopedPrisma.order.count({ where: { userId: session.user.id, status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
    ]);
    stats.totalOrders = totalOrders;
    stats.pendingOrders = pendingOrders;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark drop-shadow-sm">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-2 text-ocean-muted dark:text-ocean-muted-dark">
          {role === 'ADMIN' && 'Manage your warehouse, orders, and users from here.'}
          {role === 'WAREHOUSE' && `Manage warehouse inventory and fulfill orders${stats.branchName ? ` - ${stats.branchName} Branch` : ''}.`}
          {role === 'FIELD' && `Submit orders and manage your vehicle inventory${stats.branchName ? ` - ${stats.branchName} Branch` : ''}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(role === 'ADMIN' || role === 'WAREHOUSE' || role === 'FIELD') && (
          <>
            <div className="card">
              <h3 className="text-sm font-medium text-ocean-muted dark:text-ocean-muted-dark">Total Orders</h3>
              <p className="mt-2 text-3xl font-bold text-ocean-text dark:text-ocean-text-dark">{stats.totalOrders}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-ocean-muted dark:text-ocean-muted-dark">Pending Orders</h3>
              <p className="mt-2 text-3xl font-bold text-ocean-accent dark:text-starlight">{stats.pendingOrders}</p>
            </div>
          </>
        )}
        {(role === 'ADMIN' || role === 'WAREHOUSE') && (
          <div className="card">
            <h3 className="text-sm font-medium text-ocean-muted dark:text-ocean-muted-dark">Low Stock Items</h3>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats.lowStockItems}</p>
          </div>
        )}
        {role === 'ADMIN' && (
          <div className="card">
            <h3 className="text-sm font-medium text-ocean-muted dark:text-ocean-muted-dark">Active Users</h3>
            <p className="mt-2 text-3xl font-bold text-ocean-text dark:text-ocean-text-dark">{stats.activeUsers}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {role === 'FIELD' && (
          <>
            <Link href="/dashboard/new-order" className="card hover:shadow-2xl transition-all cursor-pointer hover:border-ocean-accent dark:hover:border-starlight hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-ocean-accent dark:bg-starlight text-white p-3 rounded-lg shadow-lg dark:animate-glow">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-ocean-text dark:text-ocean-text-dark">Submit New Order</h3>
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Request materials from the warehouse</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/vehicle-stock" className="card hover:shadow-2xl transition-all cursor-pointer hover:border-ocean-accent dark:hover:border-starlight hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-ocean-medium dark:bg-ocean-deep text-white p-3 rounded-lg shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-ocean-text dark:text-ocean-text-dark">Update Vehicle Stock</h3>
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Weekly vehicle inventory check</p>
                </div>
              </div>
            </Link>
          </>
        )}
        {(role === 'ADMIN' || role === 'WAREHOUSE') && (
          <>
            <Link href="/dashboard/orders" className="card hover:shadow-2xl transition-all cursor-pointer hover:border-ocean-accent dark:hover:border-starlight hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-ocean-accent dark:bg-starlight text-white p-3 rounded-lg shadow-lg dark:animate-glow">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-ocean-text dark:text-ocean-text-dark">Manage Orders</h3>
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">View and process orders</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/warehouse" className="card hover:shadow-2xl transition-all cursor-pointer hover:border-ocean-accent dark:hover:border-starlight hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 dark:bg-green-600 text-white p-3 rounded-lg shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-ocean-text dark:text-ocean-text-dark">Warehouse Inventory</h3>
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Manage stock levels</p>
                </div>
              </div>
            </Link>
            <div className="card p-4">
              <QuickScanButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
