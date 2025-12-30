import type { SignupData } from '../page';
import type { LicenseTier } from '@prisma/client';

interface Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
}

const TIERS: Record<LicenseTier, {
  name: string;
  price: number;
  branches: number;
  users: number;
  features: string[];
  popular?: boolean;
  recommended?: string;
}> = {
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
    recommended: 'Best for growing electrical contractors',
  },
  DISTRIBUTION: {
    name: 'DISTRIBUTION',
    price: 149.99,
    branches: 10,
    users: 9999,
    features: [
      'All ELITE Features',
      'Customer Management',
      'Route Management',
      'Delivery Tracking',
      'Sales Rep Tools',
      'Driver Mobile App',
      'Customer Self-Service Portal',
      '10 Branches Included',
      'Unlimited Users',
    ],
    recommended: 'Perfect for beer distributors & logistics companies',
  },
};

export default function TierSelection({ data, updateData, onNext }: Props) {
  const handleSelect = (tier: LicenseTier) => {
    updateData({ tier });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Choose Your Plan
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-8">
        Start your 14-day free trial. No credit card required.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {(Object.entries(TIERS) as [LicenseTier, typeof TIERS[LicenseTier]][]).map(([key, tier]) => (
          <div
            key={key}
            onClick={() => handleSelect(key)}
            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-300 ${
              data.tier === key
                ? 'border-ocean-accent dark:border-starlight bg-white dark:bg-ocean-dark shadow-2xl scale-105 dark:shadow-starlight/20'
                : 'border-ocean-light/40 dark:border-ocean-deep bg-white/70 dark:bg-ocean-dark/60 hover:border-ocean-accent dark:hover:border-starlight/70 hover:shadow-lg'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-ocean-accent dark:bg-starlight text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg dark:animate-glow">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold text-ocean-accent dark:text-starlight mb-1">
                ${tier.price}
                <span className="text-base text-ocean-muted dark:text-ocean-muted-dark">/mo</span>
              </div>
              <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
                {tier.branches} {tier.branches === 1 ? 'branch' : 'branches'} •{' '}
                {tier.users === 9999 ? 'Unlimited' : tier.users} users
              </p>
            </div>

            {tier.recommended && (
              <div className="mb-4 p-2 bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded text-xs text-center text-ocean-text dark:text-ocean-text-dark border border-ocean-accent/20 dark:border-starlight/20">
                {tier.recommended}
              </div>
            )}

            <ul className="space-y-2 mb-4">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <svg
                    className="w-4 h-4 text-ocean-accent dark:text-starlight mr-2 mt-0.5 flex-shrink-0"
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
                  <span className="text-ocean-text dark:text-ocean-text-dark">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleSelect(key)}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                data.tier === key
                  ? 'bg-ocean-accent dark:bg-starlight text-white dark:animate-glow'
                  : 'bg-ocean-light dark:bg-ocean-deep text-ocean-text dark:text-ocean-text-dark hover:bg-ocean-medium dark:hover:bg-ocean-deep/80'
              }`}
            >
              {data.tier === key ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
