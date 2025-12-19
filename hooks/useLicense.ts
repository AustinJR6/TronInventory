import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type LicenseTier = 'CORE' | 'OPS' | 'OPS_SCAN' | 'OPS_SCAN_PO';

export interface License {
  id: string;
  companyId: string;
  status: LicenseStatus;
  tier: LicenseTier;
  startsAt: string;
  expiresAt: string | null;
  notes: string | null;
}

/**
 * Feature flags based on license tier
 *
 * CORE: Basic inventory tracking, manual adjustments
 * OPS: CORE + orders + vehicle stock + role-based access
 * OPS_SCAN: OPS + barcode/QR scanning
 * OPS_SCAN_PO: OPS_SCAN + suppliers + PO management
 */
export interface LicenseFeatures {
  // CORE features
  inventoryTracking: boolean;
  manualAdjustments: boolean;

  // OPS features
  orderManagement: boolean;
  vehicleStock: boolean;
  roleBasedAccess: boolean;

  // OPS_SCAN features
  barcodeScanning: boolean;
  qrScanning: boolean;

  // OPS_SCAN_PO features
  supplierManagement: boolean;
  purchaseOrders: boolean;
  poCompilation: boolean;
}

function getTierFeatures(tier: LicenseTier): LicenseFeatures {
  const features: LicenseFeatures = {
    inventoryTracking: false,
    manualAdjustments: false,
    orderManagement: false,
    vehicleStock: false,
    roleBasedAccess: false,
    barcodeScanning: false,
    qrScanning: false,
    supplierManagement: false,
    purchaseOrders: false,
    poCompilation: false,
  };

  // CORE tier
  if (tier === 'CORE' || tier === 'OPS' || tier === 'OPS_SCAN' || tier === 'OPS_SCAN_PO') {
    features.inventoryTracking = true;
    features.manualAdjustments = true;
  }

  // OPS tier
  if (tier === 'OPS' || tier === 'OPS_SCAN' || tier === 'OPS_SCAN_PO') {
    features.orderManagement = true;
    features.vehicleStock = true;
    features.roleBasedAccess = true;
  }

  // OPS_SCAN tier
  if (tier === 'OPS_SCAN' || tier === 'OPS_SCAN_PO') {
    features.barcodeScanning = true;
    features.qrScanning = true;
  }

  // OPS_SCAN_PO tier
  if (tier === 'OPS_SCAN_PO') {
    features.supplierManagement = true;
    features.purchaseOrders = true;
    features.poCompilation = true;
  }

  return features;
}

/**
 * Hook to get the current license and feature gates
 *
 * Returns license details and feature flags for UI gating
 * Shows inactive warning if license is not ACTIVE or TRIAL
 */
export function useLicense() {
  const { data: session, status } = useSession();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLicense() {
      if (status === 'loading') {
        return;
      }

      if (!session?.user?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/licenses/${session.user.companyId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch license');
        }

        const data = await response.json();
        setLicense(data.license);
        setError(null);
      } catch (err) {
        console.error('Error fetching license:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLicense();
  }, [session?.user?.companyId, status]);

  // Determine if license is active
  const isActive = license?.status === 'ACTIVE' || license?.status === 'TRIAL';

  // Get features based on tier
  const features = license ? getTierFeatures(license.tier) : getTierFeatures('CORE');

  // Check if license is expired
  const isExpired =
    license?.expiresAt && new Date(license.expiresAt) < new Date();

  return {
    license,
    loading,
    error,
    isActive: isActive && !isExpired,
    features,
    tier: license?.tier || 'CORE',
  };
}
