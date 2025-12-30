import { useState } from 'react';
import type { SignupData } from '../page';

interface Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function BranchSetup({ data, updateData, onNext, onPrev }: Props) {
  const [branches, setBranches] = useState(data.branches);
  const [error, setError] = useState('');

  const tierLimits: Record<string, number> = {
    BASE: 1,
    ELITE: 5,
    DISTRIBUTION: 10,
  };

  const maxBranches = tierLimits[data.tier] || 1;

  const addBranch = () => {
    if (branches.length >= maxBranches) {
      setError(`Your ${data.tier} plan includes ${maxBranches} ${maxBranches === 1 ? 'branch' : 'branches'}. Upgrade for more locations.`);
      return;
    }
    setBranches([...branches, { name: '', city: '', address: '' }]);
  };

  const removeBranch = (index: number) => {
    if (branches.length === 1) {
      setError('You must have at least one branch');
      return;
    }
    setBranches(branches.filter((_, i) => i !== index));
    setError('');
  };

  const updateBranch = (index: number, field: string, value: string) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index], [field]: value };
    setBranches(newBranches);
  };

  const handleNext = () => {
    setError('');

    // Validation
    for (let i = 0; i < branches.length; i++) {
      if (!branches[i].name || !branches[i].city) {
        setError(`Branch #${i + 1}: Name and City are required`);
        return;
      }
    }

    updateData({ branches });
    onNext();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Set Up Your Locations
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-2">
        Add your warehouse locations, branches, or distribution centers
      </p>
      <p className="text-sm text-ocean-accent dark:text-starlight mb-8">
        Your {data.tier} plan includes up to {maxBranches} {maxBranches === 1 ? 'location' : 'locations'}
      </p>

      {error && (
        <div className="mb-6 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {branches.map((branch, index) => (
          <div
            key={index}
            className="bg-foam dark:bg-ocean-deep/30 rounded-lg p-6 border border-ocean-medium/20 dark:border-starlight/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ocean-text dark:text-ocean-text-dark">
                Location #{index + 1}
              </h3>
              {branches.length > 1 && (
                <button
                  onClick={() => removeBranch(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={branch.name}
                  onChange={(e) => updateBranch(index, 'name', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                  placeholder="Main Warehouse"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={branch.city}
                    onChange={(e) => updateBranch(index, 'city', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={branch.address || ''}
                    onChange={(e) => updateBranch(index, 'address', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
                    placeholder="123 Main St"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {branches.length < maxBranches && (
        <button
          onClick={addBranch}
          className="w-full px-6 py-3 bg-ocean-light dark:bg-ocean-deep border-2 border-dashed border-ocean-accent dark:border-starlight rounded-lg text-ocean-accent dark:text-starlight font-semibold hover:bg-ocean-accent/10 dark:hover:bg-starlight/10 transition-all duration-300"
        >
          + Add Another Location
        </button>
      )}

      {branches.length >= maxBranches && (
        <div className="bg-ocean-sky/20 dark:bg-ocean-deep/30 rounded-lg p-4 border border-ocean-accent/20 dark:border-starlight/20">
          <p className="text-sm text-ocean-text dark:text-ocean-text-dark">
            You've reached the {maxBranches} location limit for your {data.tier} plan. Additional locations are
            available for $19.99/month each.
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-ocean-light dark:bg-ocean-deep hover:bg-ocean-medium dark:hover:bg-ocean-deep/80 text-ocean-text dark:text-ocean-text-dark font-semibold rounded-lg transition-all duration-300"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
