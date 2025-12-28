'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupSuccessContent() {
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
      <div className="min-h-screen flex items-center justify-center bg-ocean-gradient dark:bg-ocean-night">
        <div className="text-center animate-breathe">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
          <p className="text-ocean-text dark:text-ocean-text-dark text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-gradient dark:bg-ocean-night px-4">
        <div className="max-w-md w-full bg-white/90 dark:bg-ocean-dark/90 rounded-lg p-8 border border-red-400 dark:border-red-500/30 backdrop-blur-sm animate-breathe-slow shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">Something Went Wrong</h2>
            <p className="text-ocean-muted dark:text-ocean-muted-dark mb-6">{error}</p>
            <Link
              href="/signup"
              className="inline-block bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-gradient dark:bg-ocean-night px-4">
      <div className="max-w-2xl w-full bg-white/90 dark:bg-ocean-dark/90 rounded-lg p-12 border border-ocean-medium/30 dark:border-starlight/30 backdrop-blur-sm text-center animate-breathe-slow shadow-2xl">
        <div className="mb-6 animate-wave">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-12 h-12 text-green-600 dark:text-green-400"
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

        <h1 className="text-4xl font-bold text-ocean-text dark:text-ocean-text-dark mb-4">Welcome to Manifest!</h1>
        <p className="text-xl text-ocean-muted dark:text-ocean-muted-dark mb-8">
          Your account has been created successfully
        </p>

        <div className="bg-ocean-sky/30 dark:bg-ocean-deep/50 rounded-lg p-6 mb-8 text-left backdrop-blur-sm border border-ocean-medium/20 dark:border-starlight/20">
          <h3 className="text-lg font-semibold text-ocean-text dark:text-ocean-text-dark mb-4">What's Next?</h3>
          <ul className="space-y-3 text-ocean-text dark:text-ocean-text-dark">
            <li className="flex items-start">
              <span className="text-ocean-accent dark:text-starlight font-bold mr-3">1.</span>
              <span>Sign in to your account using the credentials you created</span>
            </li>
            <li className="flex items-start">
              <span className="text-ocean-accent dark:text-starlight font-bold mr-3">2.</span>
              <span>Add your warehouse inventory items</span>
            </li>
            <li className="flex items-start">
              <span className="text-ocean-accent dark:text-starlight font-bold mr-3">3.</span>
              <span>Invite your team members</span>
            </li>
            <li className="flex items-start">
              <span className="text-ocean-accent dark:text-starlight font-bold mr-3">4.</span>
              <span>Start managing orders and tracking inventory</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-500/30 rounded-lg p-4 mb-8">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Your 14-day free trial has started!</strong> You won't be charged until the trial ends.
            Cancel anytime from your account settings.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-block bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 dark:animate-glow shadow-lg text-lg"
        >
          Sign In to Your Account
        </Link>

        <p className="text-ocean-muted dark:text-ocean-muted-dark text-sm mt-6">
          Need help? Contact us at support@manifest.com
        </p>
      </div>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ocean-gradient dark:bg-ocean-night">
          <div className="text-center animate-breathe">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
            <p className="text-ocean-text dark:text-ocean-text-dark text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupSuccessContent />
    </Suspense>
  );
}
