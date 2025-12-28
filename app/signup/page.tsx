'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<'BASE' | 'ELITE'>('BASE');
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiers = {
    BASE: {
      name: 'BASE',
      price: 49.99,
      branches: 1,
      users: 10,
      features: [
        'Inventory Tracking',
        'Order Management',
        'Vehicle Stock Management',
        'QR Code Scanning',
        'Part Requests',
        'Supplier Management',
        'Inventory Thresholds',
      ],
      popular: false,
    },
    ELITE: {
      name: 'ELITE',
      price: 99.99,
      branches: 5,
      users: 100,
      features: [
        'All BASE Features',
        'Purchase Order System',
        'AI BOM Builder',
        'Lana AI Assistant',
        '5 Branches Included',
        '100 Users Included',
      ],
      popular: true,
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tier: selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-tron-black border-b border-tron-orange/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/manifest-logo.png" alt="Manifest" className="h-16 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-white">Manifest</h1>
                <p className="text-sm text-gray-400">Inventory Management</p>
              </div>
            </div>
            <Link
              href="/login"
              className="text-tron-orange hover:text-tron-orange-light transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-300">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {Object.entries(tiers).map(([key, tier]) => (
            <div
              key={key}
              onClick={() => setSelectedTier(key as 'BASE' | 'ELITE')}
              className={`relative cursor-pointer rounded-lg border-2 p-8 transition-all ${
                selectedTier === key
                  ? 'border-tron-orange bg-tron-gray shadow-xl scale-105'
                  : 'border-gray-700 bg-gray-800 hover:border-tron-orange/50'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-tron-orange text-white px-4 py-1 rounded-full text-sm font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold text-tron-orange mb-2">
                  ${tier.price}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">
                  {tier.branches} {tier.branches === 1 ? 'branch' : 'branches'} • {tier.users} users
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-tron-orange mr-3 mt-0.5 flex-shrink-0"
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
              </ul>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setSelectedTier(key as 'BASE' | 'ELITE')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    selectedTier === key
                      ? 'bg-tron-orange text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {selectedTier === key ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Signup Form */}
        <div className="max-w-2xl mx-auto bg-tron-gray rounded-lg p-8 border border-tron-orange/30">
          <h3 className="text-2xl font-bold text-white mb-6">Create Your Account</h3>

          {error && (
            <div className="mb-6 rounded-md bg-red-900/30 border border-red-700 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                placeholder="Acme Corporation"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                placeholder="admin@acme.com"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tron-black border border-tron-orange/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tron-orange"
                />
              </div>
            </div>

            <div className="bg-tron-black/50 rounded-lg p-4 border border-tron-orange/20">
              <h4 className="text-white font-semibold mb-2">Selected Plan: {selectedTier}</h4>
              <p className="text-gray-300 text-sm">
                ${tiers[selectedTier].price}/month • {tiers[selectedTier].branches}{' '}
                {tiers[selectedTier].branches === 1 ? 'branch' : 'branches'} •{' '}
                {tiers[selectedTier].users} users
              </p>
              <p className="text-gray-400 text-xs mt-2">
                14-day free trial • Add more branches for $19.99/month • Additional users $1/month
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tron-orange hover:bg-tron-orange-light text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>

            <p className="text-center text-sm text-gray-400">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </div>

        {/* Add-on Pricing Info */}
        <div className="max-w-4xl mx-auto mt-12 bg-tron-black/30 rounded-lg p-6 border border-tron-orange/20">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            Flexible Add-Ons
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-tron-orange mb-2">$19.99/month</div>
              <p className="text-gray-300">Per Additional Branch</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-tron-orange mb-2">$1.00/month</div>
              <p className="text-gray-300">Per Additional User</p>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">
            Scale your team and locations as you grow
          </p>
        </div>
      </div>
    </div>
  );
}
