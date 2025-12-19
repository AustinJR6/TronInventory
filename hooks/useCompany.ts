import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  appName: string | null;
}

const DEFAULT_BRANDING = {
  appName: 'Tron Inventory',
  primaryColor: '#FF6B35', // Tron orange
  logoUrl: null,
};

/**
 * Hook to get the current user's company and branding information
 *
 * Returns company details including branding (logo, colors, app name)
 * Falls back to default "Tron" branding if company details not loaded
 */
export function useCompany() {
  const { data: session, status } = useSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      if (status === 'loading') {
        return;
      }

      if (!session?.user?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/companies/${session.user.companyId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch company');
        }

        const data = await response.json();
        setCompany(data.company);
        setError(null);
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [session?.user?.companyId, status]);

  // Return branding with safe defaults
  const branding = {
    appName: company?.appName || DEFAULT_BRANDING.appName,
    primaryColor: company?.primaryColor || DEFAULT_BRANDING.primaryColor,
    logoUrl: company?.logoUrl || DEFAULT_BRANDING.logoUrl,
    companyName: company?.name || 'Your Company',
  };

  return {
    company,
    branding,
    loading,
    error,
  };
}
