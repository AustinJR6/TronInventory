import type { SignupData } from '../page';
import type { BusinessModel } from '@prisma/client';

interface Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const BUSINESS_MODELS: Record<BusinessModel, {
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiredTier?: 'ELITE' | 'DISTRIBUTION';
  additionalCost?: string; // For future pricing updates
}> = {
  WAREHOUSE_ONLY: {
    name: 'Warehouse & Field Operations',
    description: 'Traditional warehouse inventory management for contractors and field workers',
    icon: '🏗️',
    features: [
      'Warehouse inventory tracking',
      'Field worker vehicle stock',
      'Order management for field crews',
      'Part requests and fulfillment',
      'QR code scanning',
    ],
  },
  DISTRIBUTION: {
    name: 'Distribution & Logistics',
    description: 'Full distribution management for wholesalers, beer distributors, and logistics companies',
    icon: '🚚',
    requiredTier: 'DISTRIBUTION',
    additionalCost: 'Included in DISTRIBUTION tier (or +$50/mo for HYBRID)',
    features: [
      'Customer management',
      'Sales rep territory management',
      'Route planning & optimization',
      'Delivery tracking with signatures',
      'Driver mobile app',
      'Customer self-service portal',
      'Customer inventory tracking',
    ],
  },
  HYBRID: {
    name: 'Hybrid Model',
    description: 'Combine warehouse operations with distribution capabilities',
    icon: '🔄',
    additionalCost: 'Base tier + $50/mo for distribution features',
    features: [
      'All warehouse features',
      'All distribution features',
      'Flexible workflows',
      'Perfect for growing businesses',
    ],
  },
};

export default function BusinessModelSelection({ data, updateData, onNext, onPrev }: Props) {
  const handleToggleModel = (model: BusinessModel) => {
    if (model === 'HYBRID') {
      // HYBRID means both WAREHOUSE_ONLY and DISTRIBUTION
      if (data.businessModels.includes('HYBRID')) {
        updateData({ businessModels: ['WAREHOUSE_ONLY'] });
      } else {
        updateData({ businessModels: ['HYBRID'] });
      }
    } else {
      // Single model selection (remove HYBRID if set)
      const models = data.businessModels.filter((m) => m !== 'HYBRID');

      if (models.includes(model)) {
        // Deselect - ensure at least WAREHOUSE_ONLY is selected
        const newModels = models.filter((m) => m !== model);
        updateData({ businessModels: newModels.length === 0 ? ['WAREHOUSE_ONLY'] : newModels });
      } else {
        // Select
        const newModels = [...models, model];

        // If both WAREHOUSE_ONLY and DISTRIBUTION are selected, switch to HYBRID
        if (newModels.includes('WAREHOUSE_ONLY') && newModels.includes('DISTRIBUTION')) {
          updateData({ businessModels: ['HYBRID'] });
        } else {
          updateData({ businessModels: newModels });
        }
      }
    }
  };

  const isSelected = (model: BusinessModel) => {
    if (model === 'HYBRID') {
      return data.businessModels.includes('HYBRID');
    }
    return data.businessModels.includes(model) || data.businessModels.includes('HYBRID');
  };

  const canSelectModel = (model: BusinessModel) => {
    const modelConfig = BUSINESS_MODELS[model];
    if (!modelConfig.requiredTier) return true;

    // Check if tier supports this model
    if (modelConfig.requiredTier === 'DISTRIBUTION') {
      return data.tier === 'DISTRIBUTION' || data.tier === 'ELITE';
    }
    if (modelConfig.requiredTier === 'ELITE') {
      return data.tier === 'ELITE' || data.tier === 'DISTRIBUTION';
    }

    return true;
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Select Your Business Model
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-8">
        Choose how you want to use Manifest. You can select multiple models or switch later.
      </p>

      <div className="space-y-4 mb-8">
        {(Object.entries(BUSINESS_MODELS) as [BusinessModel, typeof BUSINESS_MODELS[BusinessModel]][]).map(
          ([key, model]) => {
            const selected = isSelected(key);
            const canSelect = canSelectModel(key);

            return (
              <div
                key={key}
                onClick={() => canSelect && handleToggleModel(key)}
                className={`rounded-lg border-2 p-6 transition-all duration-300 ${
                  !canSelect
                    ? 'opacity-50 cursor-not-allowed border-ocean-light/40 dark:border-ocean-deep bg-white/30 dark:bg-ocean-dark/30'
                    : selected
                    ? 'border-ocean-accent dark:border-starlight bg-white dark:bg-ocean-dark shadow-lg cursor-pointer'
                    : 'border-ocean-light/40 dark:border-ocean-deep bg-white/70 dark:bg-ocean-dark/60 hover:border-ocean-accent dark:hover:border-starlight/70 hover:shadow-lg cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">{model.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-ocean-text dark:text-ocean-text-dark">
                          {model.name}
                        </h3>
                        {model.additionalCost && (
                          <p className="text-xs text-ocean-accent dark:text-starlight font-medium">
                            {model.additionalCost}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-ocean-muted dark:text-ocean-muted-dark mb-4">{model.description}</p>

                    <ul className="grid md:grid-cols-2 gap-2">
                      {model.features.map((feature, idx) => (
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

                    {!canSelect && model.requiredTier && (
                      <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-400 dark:border-orange-700 rounded">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          Requires {model.requiredTier} tier or higher. Please upgrade your plan.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                        selected
                          ? 'bg-ocean-accent dark:bg-starlight border-ocean-accent dark:border-starlight'
                          : 'border-ocean-light dark:border-ocean-deep'
                      }`}
                    >
                      {selected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded-lg p-4 border border-ocean-accent/20 dark:border-starlight/20 mb-8">
        <p className="text-sm text-ocean-text dark:text-ocean-text-dark">
          <strong>Note:</strong> Pricing for additional business models will be added in future updates.
          For now, select the models that fit your needs and we'll work with you on custom pricing.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
        >
          ← Back
        </button>
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
