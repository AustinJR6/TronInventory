'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface License {
  tier: 'CORE' | 'OPS' | 'OPS_SCAN' | 'OPS_SCAN_PO';
  status: string;
  expiresAt: string | null;
}

export default function UpgradePage() {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicense();
  }, []);

  const fetchLicense = async () => {
    try {
      const response = await fetch('/api/licenses/current');
      if (response.ok) {
        const data = await response.json();
        setLicense(data.license);
      }
    } catch (error) {
      console.error('Error fetching license:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: 'CORE',
      displayName: 'Core',
      price: 'Free',
      billing: '30-day trial',
      description: 'Perfect for getting started',
      features: [
        '1 branch location',
        'Up to 5 users',
        'Basic inventory management',
        'Order management',
        'Email support',
      ],
      limitations: [
        'Limited reporting',
        'No custom branding',
        'No part requests',
      ],
    },
    {
      name: 'OPS',
      displayName: 'Operations',
      price: '$99',
      billing: 'per month',
      description: 'Best for growing companies',
      features: [
        'Up to 5 branch locations',
        'Unlimited users',
        'Full inventory management',
        'Advanced reporting & KPIs',
        'Custom branding (logo & colors)',
        'Part request system',
        'Priority email support',
        'Branch inventory duplication',
      ],
      limitations: [],
      popular: true,
    },
    {
      name: 'OPS_SCAN',
      displayName: 'Operations + Scan',
      price: '$199',
      billing: 'per month',
      description: 'For companies needing mobile capabilities',
      features: [
        'Up to 10 branch locations',
        'Everything in Operations, plus:',
        'Barcode scanning',
        'Mobile app access',
        'Offline mode',
        'Advanced analytics',
        'Phone & email support',
      ],
      limitations: [],
    },
    {
      name: 'OPS_SCAN_PO',
      displayName: 'Enterprise',
      price: '$299',
      billing: 'per month',
      description: 'Complete solution for large organizations',
      features: [
        'Unlimited branch locations',
        'Everything in Operations + Scan, plus:',
        'Purchase order management',
        'Vendor integrations',
        'Custom integrations (API access)',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom training sessions',
        'SLA guarantee',
      ],
      limitations: [],
    },
  ];

  const currentTierIndex = tiers.findIndex(t => t.name === license?.tier);

  if (loading) {
    return <div className="text-center py-8 text-white">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Upgrade Your Plan</h1>
        <p className="mt-2 text-gray-300">
          Choose the plan that's right for your organization
        </p>
      </div>

      {/* Current Plan Card */}
      {license && (
        <div className="mb-8 card border-2 border-starlight">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Current Plan</h2>
              <p className="mt-1 text-2xl font-bold text-starlight">
                {tiers[currentTierIndex]?.displayName || license.tier}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                Status: <span className="text-green-400">{license.status}</span>
              </p>
              {license.expiresAt && (
                <p className="mt-1 text-sm text-gray-400">
                  Expires: {new Date(license.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <Link
                href="/dashboard/settings"
                className="text-sm text-starlight hover:text-starlight-light underline"
              >
                Manage License →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Feature Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {tiers.map((tier, index) => {
          const isCurrent = tier.name === license?.tier;
          const isUpgrade = index > currentTierIndex;

          return (
            <div
              key={tier.name}
              className={`card relative ${
                tier.popular
                  ? 'border-2 border-starlight ring-2 ring-tron-orange/20'
                  : isCurrent
                  ? 'border-2 border-green-500'
                  : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-starlight text-white px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                  CURRENT
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white">{tier.displayName}</h3>
                <p className="text-sm text-gray-400 mt-1">{tier.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400 ml-2">{tier.billing}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <svg
                      className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
                {tier.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <svg
                      className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-gray-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                  Current Plan
                </button>
              ) : isUpgrade ? (
                <a
                  href="mailto:sales@example.com?subject=Upgrade to {tier.displayName}"
                  className="btn-primary w-full text-center block"
                >
                  Upgrade Now
                </a>
              ) : (
                <button disabled className="btn-secondary w-full opacity-50">
                  Lower Tier
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="card overflow-hidden mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Detailed Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-tron-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-starlight uppercase">
                  Feature
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier.name}
                    className="px-6 py-3 text-center text-xs font-medium text-starlight uppercase"
                  >
                    {tier.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tron-orange/20">
              {[
                { feature: 'Branch Locations', values: ['1', '5', '10', 'Unlimited'] },
                { feature: 'Users', values: ['5', 'Unlimited', 'Unlimited', 'Unlimited'] },
                { feature: 'Custom Branding', values: ['❌', '✅', '✅', '✅'] },
                { feature: 'Part Requests', values: ['❌', '✅', '✅', '✅'] },
                { feature: 'Advanced Reporting', values: ['❌', '✅', '✅', '✅'] },
                { feature: 'Barcode Scanning', values: ['❌', '❌', '✅', '✅'] },
                { feature: 'Mobile App', values: ['❌', '❌', '✅', '✅'] },
                { feature: 'Purchase Orders', values: ['❌', '❌', '❌', '✅'] },
                { feature: 'API Access', values: ['❌', '❌', '❌', '✅'] },
                { feature: 'Priority Support', values: ['❌', 'Email', 'Phone & Email', '24/7'] },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-ocean-deep">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {row.feature}
                  </td>
                  {row.values.map((value, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ / Contact */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
        <p className="text-gray-300 mb-4">
          Our team is here to help you find the perfect plan for your organization.
        </p>
        <div className="flex gap-4">
          <a
            href="mailto:sales@example.com"
            className="btn-primary"
          >
            Contact Sales
          </a>
          <a
            href="tel:+1234567890"
            className="btn-secondary"
          >
            Call Us
          </a>
        </div>
      </div>
    </div>
  );
}
