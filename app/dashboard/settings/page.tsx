'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/hooks/useCompany';
import { useLicense } from '@/hooks/useLicense';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { company, branding, loading: companyLoading } = useCompany();
  const { license, loading: licenseLoading } = useLicense();

  const [formData, setFormData] = useState({
    name: '',
    appName: '',
    logoUrl: '',
    primaryColor: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is ADMIN
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Load company data into form
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        appName: company.appName || '',
        logoUrl: company.logoUrl || '',
        primaryColor: company.primaryColor || '',
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/companies/${session?.user.companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings updated successfully! Refresh the page to see changes.' });

      // Optionally reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || companyLoading || licenseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Company Settings</h1>
        <p className="text-gray-400">Manage your company branding and license information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branding Settings */}
        <div className="lg:col-span-2">
          <div className="bg-ocean-dark rounded-lg p-6 border border-starlight/30">
            <h2 className="text-xl font-semibold text-white mb-4">Branding</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-tron-black border border-starlight/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                  required
                />
              </div>

              <div>
                <label htmlFor="appName" className="block text-sm font-medium text-gray-300 mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  id="appName"
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  placeholder="Manifest"
                  className="w-full px-3 py-2 bg-tron-black border border-starlight/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                />
                <p className="mt-1 text-xs text-gray-400">Displayed in navigation and page titles</p>
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-300 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-tron-black border border-starlight/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                />
                <p className="mt-1 text-xs text-gray-400">External URL to your company logo image</p>
              </div>

              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-300 mb-1">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={formData.primaryColor || '#FF6B35'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-20 bg-tron-black border border-starlight/30 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#FF6B35'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#FF6B35"
                    className="flex-1 px-3 py-2 bg-tron-black border border-starlight/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange font-mono text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Hex color code for accent color throughout the app
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md ${
                    message.type === 'success'
                      ? 'bg-green-900/20 border border-green-500/50 text-green-400'
                      : 'bg-red-900/20 border border-red-500/50 text-red-400'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-starlight text-white px-4 py-2 rounded-md hover:bg-starlight/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* License Info */}
        <div className="space-y-6">
          <div className="bg-ocean-dark rounded-lg p-6 border border-starlight/30">
            <h2 className="text-xl font-semibold text-white mb-4">License</h2>

            {license ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
                  <p
                    className={`text-sm font-medium ${
                      license.status === 'ACTIVE'
                        ? 'text-green-400'
                        : license.status === 'TRIAL'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {license.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Tier</p>
                  <p className="text-sm font-medium text-white">{license.tier}</p>
                </div>

                {license.expiresAt && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Expires</p>
                    <p className="text-sm text-gray-300">
                      {new Date(license.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {license.notes && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Notes</p>
                    <p className="text-xs text-gray-300">{license.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No license information available</p>
            )}

            <div className="mt-4 pt-4 border-t border-starlight/30">
              <p className="text-xs text-gray-500">
                Contact support to upgrade or modify your license
              </p>
            </div>
          </div>

          {/* Current Branding Preview */}
          <div className="bg-ocean-dark rounded-lg p-6 border border-starlight/30">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Colors</p>
                <div
                  className="h-12 rounded-md border border-starlight/30"
                  style={{ backgroundColor: branding.primaryColor }}
                ></div>
                <p className="text-xs text-gray-400 mt-1 font-mono">{branding.primaryColor}</p>
              </div>

              {branding.logoUrl && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Logo</p>
                  <img
                    src={branding.logoUrl}
                    alt="Company Logo"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
