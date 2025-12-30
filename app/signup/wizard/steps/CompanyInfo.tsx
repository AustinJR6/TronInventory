import { useState } from 'react';
import type { SignupData } from '../page';

interface Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function CompanyInfo({ data, updateData, onNext, onPrev }: Props) {
  const [formData, setFormData] = useState({
    companyName: data.companyName || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    password: data.password || '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');

    // Validation
    if (!formData.companyName || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    updateData({
      companyName: formData.companyName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    });

    onNext();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">
        Company Information
      </h2>
      <p className="text-ocean-muted dark:text-ocean-muted-dark mb-8">
        Tell us about your company and create your admin account
      </p>

      {error && (
        <div className="mb-6 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
            Company Name *
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
            placeholder="Acme Corporation"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
            placeholder="admin@acme.com"
          />
          <p className="text-xs text-ocean-muted dark:text-ocean-muted-dark mt-1">
            This will be your admin login email
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
              Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark placeholder-ocean-muted dark:placeholder-ocean-muted-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ocean-text dark:text-ocean-text-dark mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-foam dark:bg-ocean-deep/50 border border-ocean-medium/30 dark:border-starlight/30 rounded-md text-ocean-text dark:text-ocean-text-dark focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300"
            />
          </div>
        </div>
      </div>

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
