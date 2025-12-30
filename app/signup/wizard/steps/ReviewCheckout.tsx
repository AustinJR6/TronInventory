import type { SignupData } from '../page';

interface Props {
  data: SignupData;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const TIER_PRICES: Record<string, number> = {
  BASE: 49.99,
  ELITE: 99.99,
  DISTRIBUTION: 149.99,
};

export default function ReviewCheckout({ data, onPrev, onSubmit, loading }: Props) {
  const tierPrice = TIER_PRICES[data.tier] || 0;
  const additionalBranchCost = Math.max(0, data.branches.length - getTierLimits(data.tier).branches) * 19.99;
  const additionalUserCost = Math.max(0, data.users.length + 1 - getTierLimits(data.tier).users) * 1.0; // +1 for admin
  const totalMonthly = tierPrice + additionalBranchCost + additionalUserCost;

  function getTierLimits(tier: string) {
    const limits: Record<string, { branches: number; users: number }> = {
      BASE: { branches: 1, users: 10 },
      ELITE: { branches: 5, users: 100 },
      DISTRIBUTION: { branches: 10, users: 9999 },
    };
    return limits[tier] || limits.BASE;
  }

  const getBusinessModelNames = () => {
    if (data.businessModels.includes('HYBRID')) {
      return 'Hybrid (Warehouse + Distribution)';
    }
    return data.businessModels
      .map((m) => {
        if (m === 'WAREHOUSE_ONLY') return 'Warehouse & Field Operations';
        if (m === 'DISTRIBUTION') return 'Distribution & Logistics';
        return m;
      })
      .join(', ');
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Review Your Setup
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-8">
        Review your configuration before proceeding to checkout
      </p>

      <div className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
          <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">Plan & Pricing</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-ocean-text dark:text-ocean-text-dark">{data.tier} Plan</span>
              <span className="font-semibold text-ocean-accent dark:text-starlight">${tierPrice.toFixed(2)}/mo</span>
            </div>
            {additionalBranchCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ocean-muted dark:text-ocean-muted-dark">
                  Additional Branches ({Math.max(0, data.branches.length - getTierLimits(data.tier).branches)} × $19.99)
                </span>
                <span className="text-ocean-text dark:text-ocean-text-dark">${additionalBranchCost.toFixed(2)}/mo</span>
              </div>
            )}
            {additionalUserCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ocean-muted dark:text-ocean-muted-dark">
                  Additional Users ({Math.max(0, data.users.length + 1 - getTierLimits(data.tier).users)} × $1.00)
                </span>
                <span className="text-ocean-text dark:text-ocean-text-dark">${additionalUserCost.toFixed(2)}/mo</span>
              </div>
            )}
            <div className="pt-3 border-t border-ocean-medium/30 dark:border-starlight/30 flex justify-between">
              <span className="font-bold text-ocean-text dark:text-ocean-text-dark">Total</span>
              <span className="font-bold text-2xl text-ocean-accent dark:text-starlight">${totalMonthly.toFixed(2)}/mo</span>
            </div>
            <div className="text-sm text-ocean-muted dark:text-ocean-muted-dark text-center pt-2">
              14-day free trial • Cancel anytime
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
          <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">Company Information</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Company Name:</span>
              <p className="font-medium text-ocean-text dark:text-ocean-text-dark">{data.companyName}</p>
            </div>
            <div>
              <span className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Admin User:</span>
              <p className="font-medium text-ocean-text dark:text-ocean-text-dark">
                {data.firstName} {data.lastName} ({data.email})
              </p>
            </div>
            <div>
              <span className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Business Model:</span>
              <p className="font-medium text-ocean-text dark:text-ocean-text-dark">{getBusinessModelNames()}</p>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
          <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
            Locations ({data.branches.length})
          </h3>
          <div className="space-y-2">
            {data.branches.map((branch, idx) => (
              <div key={idx} className="flex items-center">
                <svg
                  className="w-4 h-4 text-ocean-accent dark:text-starlight mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-ocean-text dark:text-ocean-text-dark">
                  {branch.name} - {branch.city}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        {data.users.length > 0 && (
          <div className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20">
            <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
              Team Members ({data.users.length})
            </h3>
            <div className="space-y-2">
              {data.users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-ocean-accent dark:text-starlight mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-ocean-text dark:text-ocean-text-dark">{user.name} ({user.email})</span>
                  </div>
                  <span className="text-sm text-ocean-muted dark:text-ocean-muted-dark">{user.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-accent/20 dark:border-starlight/20">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-ocean-accent dark:text-starlight mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-ocean-text dark:text-ocean-text-dark">
            <p className="font-semibold mb-2">What happens next?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>You'll be redirected to Stripe for secure payment setup</li>
              <li>Your 14-day free trial starts immediately</li>
              <li>You won't be charged until the trial ends</li>
              <li>All your data will be ready when you log in</li>
              <li>You can cancel anytime, no questions asked</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          disabled={loading}
          className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Processing...' : 'Start Free Trial →'}
        </button>
      </div>
    </div>
  );
}
