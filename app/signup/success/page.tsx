'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignupSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Give webhook a moment to process
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tron-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-tron-orange mx-auto mb-4"></div>
          <p className="text-white text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tron-black px-4">
        <div className="max-w-md w-full bg-tron-gray rounded-lg p-8 border border-red-500/30">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <Link
              href="/signup"
              className="inline-block bg-tron-orange hover:bg-tron-orange-light text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tron-black px-4">
      <div className="max-w-2xl w-full bg-tron-gray rounded-lg p-12 border border-tron-orange/30 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-500"
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
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Manifest!</h1>
        <p className="text-xl text-gray-300 mb-8">
          Your account has been created successfully
        </p>

        <div className="bg-tron-black/50 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-tron-orange font-bold mr-3">1.</span>
              <span>Sign in to your account using the credentials you created</span>
            </li>
            <li className="flex items-start">
              <span className="text-tron-orange font-bold mr-3">2.</span>
              <span>Add your warehouse inventory items</span>
            </li>
            <li className="flex items-start">
              <span className="text-tron-orange font-bold mr-3">3.</span>
              <span>Invite your team members</span>
            </li>
            <li className="flex items-start">
              <span className="text-tron-orange font-bold mr-3">4.</span>
              <span>Start managing orders and tracking inventory</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-8">
          <p className="text-blue-300 text-sm">
            <strong>Your 14-day free trial has started!</strong> You won't be charged until the trial ends.
            Cancel anytime from your account settings.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-block bg-tron-orange hover:bg-tron-orange-light text-white font-bold px-8 py-3 rounded-lg transition-colors text-lg"
        >
          Sign In to Your Account
        </Link>

        <p className="text-gray-400 text-sm mt-6">
          Need help? Contact us at support@manifest.com
        </p>
      </div>
    </div>
  );
}
