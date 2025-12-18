'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface NavigationProps {
  role: string;
  userName: string;
  vehicleNumber?: string;
}

export function Navigation({ role, userName, vehicleNumber }: NavigationProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = {
    ADMIN: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/warehouse', label: 'Warehouse Inventory' },
      { href: '/dashboard/orders', label: 'Orders' },
      { href: '/dashboard/users', label: 'User Management' },
    ],
    WAREHOUSE: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/warehouse', label: 'Warehouse Inventory' },
      { href: '/dashboard/orders', label: 'Orders' },
    ],
    FIELD: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/my-orders', label: 'My Orders' },
      { href: '/dashboard/new-order', label: 'New Order' },
      { href: '/dashboard/vehicle-stock', label: 'Vehicle Stock' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-tron-red text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold">
                TS
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Tron Solar
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'border-tron-red text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm text-right">
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-gray-500 text-xs">
                    {role}
                    {vehicleNumber && ` - Vehicle ${vehicleNumber}`}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    href="/dashboard/update-password"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Update Password
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="pt-2 pb-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === item.href
                  ? 'border-tron-red bg-red-50 text-tron-red'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
