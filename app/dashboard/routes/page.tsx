'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Route {
  id: string;
  name: string;
  description: string | null;
  daysOfWeek: string[];
  isActive: boolean;
  driver: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    customers: number;
    deliveries: number;
  };
}

export default function RoutesPage() {
  const { data: session } = useSession();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes');
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    if (!showInactive && !route.isActive) return false;
    return true;
  });

  const getDaysDisplay = (days: string[]) => {
    if (days.length === 0) return 'No days set';
    if (days.length === 7) return 'Every day';

    const dayMap: Record<string, string> = {
      MONDAY: 'Mon',
      TUESDAY: 'Tue',
      WEDNESDAY: 'Wed',
      THURSDAY: 'Thu',
      FRIDAY: 'Fri',
      SATURDAY: 'Sat',
      SUNDAY: 'Sun',
    };

    return days.map((d) => dayMap[d] || d).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">
              Delivery Routes
            </h1>
            <p className="text-ocean-muted dark:text-ocean-muted-dark">
              Manage your delivery routes and assignments
            </p>
          </div>
          <Link
            href="/dashboard/routes/new"
            className="px-6 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
          >
            + Add Route
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-4 border border-ocean-medium/20 dark:border-starlight/20 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 w-4 h-4 text-ocean-accent dark:text-starlight bg-white dark:bg-ocean-deep/50 border-ocean-medium/30 dark:border-starlight/30 rounded focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight"
            />
            <span className="text-sm font-medium text-ocean-text dark:text-ocean-text-dark">
              Show inactive routes
            </span>
          </label>
        </div>

        {/* Routes Grid */}
        {filteredRoutes.length === 0 ? (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-12 border-2 border-dashed border-ocean-medium/30 dark:border-starlight/30 text-center">
            <p className="text-ocean-muted dark:text-ocean-muted-dark text-lg">
              {showInactive
                ? 'No routes found'
                : 'No active routes yet. Add your first route to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/dashboard/routes/${route.id}`}
                className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20 hover:border-ocean-accent dark:hover:border-starlight transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark">
                    {route.name}
                  </h3>
                  {!route.isActive && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300">
                      Inactive
                    </span>
                  )}
                </div>

                {route.description && (
                  <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark mb-4">
                    {route.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-ocean-muted dark:text-ocean-muted-dark uppercase">Driver</label>
                    <p className="text-sm text-ocean-text dark:text-ocean-text-dark font-medium">
                      {route.driver?.name || 'Unassigned'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-ocean-muted dark:text-ocean-muted-dark uppercase">Days</label>
                    <p className="text-sm text-ocean-text dark:text-ocean-text-dark">
                      {getDaysDisplay(route.daysOfWeek)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-ocean-medium/20 dark:border-starlight/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-ocean-muted dark:text-ocean-muted-dark">Customers:</span>
                      <span className="text-ocean-text dark:text-ocean-text-dark font-semibold">
                        {route._count.customers}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-ocean-muted dark:text-ocean-muted-dark">Deliveries:</span>
                      <span className="text-ocean-text dark:text-ocean-text-dark font-semibold">
                        {route._count.deliveries}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
