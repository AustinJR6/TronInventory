'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';

interface NavigationProps {
  role: string;
  userName: string;
  vehicleNumber?: string;
}

export function Navigation({ role, userName, vehicleNumber }: NavigationProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { branding } = useCompany();

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

  // Apply dynamic CSS variables for branding
  useEffect(() => {
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
    } else {
      // Fallback to default Tron orange if no primary color set
      document.documentElement.style.setProperty('--color-primary', '#FF6B35');
    }
  }, [branding.primaryColor]);

  const navItems = {
    ADMIN: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/warehouse', label: 'Warehouse Inventory' },
      { href: '/dashboard/orders', label: 'Orders' },
      { href: '/dashboard/branches', label: 'Branches' },
      { href: '/dashboard/users', label: 'User Management' },
      { href: '/dashboard/settings', label: 'Settings' },
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

  // Use CSS variable for primary color
  const primaryColorClass = 'text-[var(--color-primary,#FF6B35)]';
  const primaryBorderClass = 'border-[var(--color-primary,#FF6B35)]';
  const primaryBorderHoverClass = 'hover:border-[var(--color-primary,#FF6B35)]/50';

  return (
    <nav className="bg-tron-black shadow-lg border-b border-tron-orange/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.companyName} Logo`}
                  className="h-12 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div className="text-xl font-bold text-white">
                  {branding.appName || branding.companyName}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? `${primaryBorderClass} ${primaryColorClass}`
                      : `border-transparent text-gray-300 ${primaryBorderHoverClass} hover:text-white`
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
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-tron-gray transition-colors"
              >
                <div className="text-sm text-right">
                  <p className="font-medium text-white">{userName}</p>
                  <p className={`text-xs ${primaryColorClass}`}>
                    {role}
                    {vehicleNumber && ` - Vehicle ${vehicleNumber}`}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${primaryColorClass} transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-tron-gray rounded-md shadow-lg py-1 z-50 border border-tron-orange/30">
                  {role === 'ADMIN' && (
                    <Link
                      href="/dashboard/settings"
                      className={`block px-4 py-2 text-sm text-gray-200 hover:bg-tron-gray-light hover:${primaryColorClass}`}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Company Settings
                    </Link>
                  )}
                  <Link
                    href="/dashboard/update-password"
                    className={`block px-4 py-2 text-sm text-gray-200 hover:bg-tron-gray-light hover:${primaryColorClass}`}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Update Password
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-tron-gray-light"
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
      <div className="sm:hidden border-t border-tron-orange/30">
        <div className="pt-2 pb-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === item.href
                  ? `${primaryBorderClass} bg-tron-gray ${primaryColorClass}`
                  : `border-transparent text-gray-300 hover:bg-tron-gray ${primaryBorderHoverClass} hover:text-white`
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
