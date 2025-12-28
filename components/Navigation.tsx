'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import ThemeToggle from './ThemeToggle';

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
      { href: '/dashboard/ai-assistant', label: 'Lana AI' },
      { href: '/dashboard/ai-bom-builder', label: 'AI BOM Builder' },
      { href: '/dashboard/manage-part-requests', label: 'Part Requests' },
      { href: '/dashboard/distributors', label: 'Distributors' },
      { href: '/dashboard/supplier-mappings', label: 'Supplier Mappings' },
      { href: '/dashboard/thresholds', label: 'Thresholds' },
      { href: '/dashboard/branches', label: 'Branches' },
      { href: '/dashboard/bulk-qr', label: 'Bulk QR Codes' },
      { href: '/dashboard/users', label: 'User Management' },
      { href: '/dashboard/settings', label: 'Settings' },
    ],
    WAREHOUSE: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/warehouse', label: 'Warehouse Inventory' },
      { href: '/dashboard/orders', label: 'Orders' },
      { href: '/dashboard/ai-assistant', label: 'Lana AI' },
      { href: '/dashboard/manage-part-requests', label: 'Part Requests' },
      { href: '/dashboard/supplier-mappings', label: 'Supplier Mappings' },
      { href: '/dashboard/thresholds', label: 'Thresholds' },
    ],
    FIELD: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/my-orders', label: 'My Orders' },
      { href: '/dashboard/new-order', label: 'New Order' },
      { href: '/dashboard/ai-assistant', label: 'Lana AI' },
      { href: '/dashboard/ai-bom-builder', label: 'AI BOM Builder' },
      { href: '/dashboard/vehicle-stock', label: 'Vehicle Stock' },
      { href: '/dashboard/part-requests', label: 'Request Parts' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || [];

  // Use CSS variable for primary color
  const primaryColorClass = 'text-[var(--color-primary,#FF6B35)]';
  const primaryBorderClass = 'border-[var(--color-primary,#FF6B35)]';
  const primaryBorderHoverClass = 'hover:border-[var(--color-primary,#FF6B35)]/50';

  return (
    <nav className="bg-white dark:bg-tron-black shadow-lg border-b border-sherbet-orange/30 dark:border-tron-orange/30 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.companyName} Logo`}
                  className="h-12 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div className="text-xl font-bold text-text-light dark:text-white">
                  {branding.appName || branding.companyName}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? `${primaryBorderClass} text-sherbet-orange dark:text-tron-orange`
                      : `border-transparent text-text-light-muted dark:text-gray-300 hover:border-sherbet-orange/50 dark:hover:border-tron-orange/50 hover:text-sherbet-orange dark:hover:text-white`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-cream-dark dark:hover:bg-tron-gray transition-all duration-200"
              >
                <div className="text-sm text-right">
                  <p className="font-medium text-text-light dark:text-white">{userName}</p>
                  <p className="text-xs text-sherbet-orange dark:text-tron-orange">
                    {role}
                    {vehicleNumber && ` - Vehicle ${vehicleNumber}`}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-sherbet-orange dark:text-tron-orange transition-transform duration-200"
                  style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-tron-gray rounded-md shadow-lg py-1 z-50 border border-sherbet-orange/30 dark:border-tron-orange/30 transition-all duration-200">
                  {role === 'ADMIN' && (
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-text-light dark:text-gray-200 hover:bg-cream dark:hover:bg-tron-gray-light hover:text-sherbet-orange dark:hover:text-tron-orange transition-all duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Company Settings
                    </Link>
                  )}
                  <Link
                    href="/dashboard/update-password"
                    className="block px-4 py-2 text-sm text-text-light dark:text-gray-200 hover:bg-cream dark:hover:bg-tron-gray-light hover:text-sherbet-orange dark:hover:text-tron-orange transition-all duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Update Password
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-cream dark:hover:bg-tron-gray-light transition-all duration-200"
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
