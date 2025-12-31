'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BusinessModel, LicenseTier } from '@prisma/client';

// Step components
import TierSelection from './steps/TierSelection';
import CompanyInfo from './steps/CompanyInfo';
import BusinessModelSelection from './steps/BusinessModelSelection';
import BranchSetup from './steps/BranchSetup';
import UserSetup from './steps/UserSetup';
import ReviewCheckout from './steps/ReviewCheckout';

export type SignupData = {
  // Tier & Pricing
  tier: LicenseTier;

  // Company Info
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;

  // Business Models (can select multiple for HYBRID)
  businessModels: BusinessModel[];

  // Admin User
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // Branches
  branches: Array<{
    name: string;
    city: string;
    address?: string;
  }>;

  // Additional Users
  users: Array<{
    name: string;
    email: string;
    role: 'ADMIN' | 'WAREHOUSE' | 'FIELD' | 'SALES_REP' | 'DRIVER';
    branchName?: string;
  }>;
};

const STEPS = [
  { id: 1, name: 'Select Plan', component: TierSelection },
  { id: 2, name: 'Company Info', component: CompanyInfo },
  { id: 3, name: 'Business Model', component: BusinessModelSelection },
  { id: 4, name: 'Locations', component: BranchSetup },
  { id: 5, name: 'Team Members', component: UserSetup },
  { id: 6, name: 'Review & Checkout', component: ReviewCheckout },
];

export default function SignupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>({
    tier: 'BASE',
    companyName: '',
    businessModels: ['WAREHOUSE_ONLY'],
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    branches: [{ name: 'Main Warehouse', city: '' }],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Submitting signup data:', signupData);

      const response = await fetch('/api/signup/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      console.log('Response status:', response.status, response.statusText);

      // Try to parse JSON, but handle cases where response is not JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Signup failed: ${response.status}`);
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        console.log('Redirecting to:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night">
      {/* Header */}
      <div className="bg-white/80 dark:bg-ocean-dark/90 border-b border-ocean-medium/30 dark:border-starlight/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/manifest-logo.png" alt="Manifest" className="h-16 w-auto animate-float" />
              <div>
                <h1 className="text-2xl font-bold text-ocean-text dark:text-ocean-text-dark">Manifest</h1>
                <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">Inventory Management</p>
              </div>
            </div>
            <Link
              href="/login"
              className="text-ocean-accent dark:text-starlight hover:text-ocean-medium dark:hover:text-starlight-glow transition-colors font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/70 dark:bg-ocean-dark/70 border-b border-ocean-medium/20 dark:border-starlight/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= step.id
                        ? 'bg-ocean-accent dark:bg-starlight text-white dark:animate-glow'
                        : 'bg-ocean-light dark:bg-ocean-deep text-ocean-muted dark:text-ocean-muted-dark'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center hidden sm:block ${
                      currentStep >= step.id
                        ? 'text-ocean-text dark:text-ocean-text-dark font-medium'
                        : 'text-ocean-muted dark:text-ocean-muted-dark'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.id
                        ? 'bg-ocean-accent dark:bg-starlight'
                        : 'bg-ocean-light dark:bg-ocean-deep'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 p-4 animate-breathe">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white/90 dark:bg-ocean-dark/90 rounded-lg p-8 border border-ocean-medium/30 dark:border-starlight/30 backdrop-blur-sm shadow-2xl animate-breathe-slow">
          <CurrentStepComponent
            data={signupData}
            updateData={updateSignupData}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
