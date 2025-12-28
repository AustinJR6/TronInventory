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
    <nav className="bg-white/90 dark:bg-ocean-dark/95 shadow-lg border-b border-ocean-medium/30 dark:border-starlight/30 transition-all duration-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.companyName} Logo`}
                  className="h-12 w-auto max-w-[120px] object-contain animate-float"
                />
              ) : (
                <div className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark">
                  {branding.appName || branding.companyName}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    pathname === item.href
                      ? `border-ocean-accent dark:border-starlight text-ocean-accent dark:text-starlight font-semibold dark:drop-shadow-[0_0_8px_rgba(79,195,247,0.6)]`
                      : `border-transparent text-ocean-muted dark:text-ocean-muted-dark hover:border-ocean-accent/50 dark:hover:border-starlight/50 hover:text-ocean-accent dark:hover:text-starlight`
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
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-ocean-light/20 dark:hover:bg-ocean-deep/50 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-sm text-right">
                  <p className="font-medium text-ocean-text dark:text-ocean-text-dark">{userName}</p>
                  <p className="text-xs text-ocean-accent dark:text-starlight">
                    {role}
                    {vehicleNumber && ` - Vehicle ${vehicleNumber}`}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-ocean-accent dark:text-starlight transition-transform duration-300"
                  style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-ocean-dark/95 rounded-md shadow-2xl py-1 z-50 border border-ocean-medium/30 dark:border-starlight/30 backdrop-blur-sm animate-breathe">
                  {role === 'ADMIN' && (
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-ocean-text dark:text-ocean-text-dark hover:bg-ocean-light/20 dark:hover:bg-ocean-deep/50 hover:text-ocean-accent dark:hover:text-starlight transition-all duration-300 transform hover:translate-x-1"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Company Settings
                    </Link>
                  )}
                  <Link
                    href="/dashboard/update-password"
                    className="block px-4 py-2 text-sm text-ocean-text dark:text-ocean-text-dark hover:bg-ocean-light/20 dark:hover:bg-ocean-deep/50 hover:text-ocean-accent dark:hover:text-starlight transition-all duration-300 transform hover:translate-x-1"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Update Password
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-ocean-light/20 dark:hover:bg-ocean-deep/50 transition-all duration-300 transform hover:translate-x-1"
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
      <div className="sm:hidden border-t border-ocean-medium/30 dark:border-starlight/30">
        <div className="pt-2 pb-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-300 ${
                pathname === item.href
                  ? `border-ocean-accent dark:border-starlight bg-ocean-light/20 dark:bg-ocean-deep/50 text-ocean-accent dark:text-starlight font-semibold`
                  : `border-transparent text-ocean-muted dark:text-ocean-muted-dark hover:bg-ocean-light/10 dark:hover:bg-ocean-deep/30 hover:border-ocean-accent/50 dark:hover:border-starlight/50 hover:text-ocean-accent dark:hover:text-starlight`
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
