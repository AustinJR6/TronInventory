'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-gradient dark:bg-ocean-night px-4">
      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-ocean-dark/90 p-8 rounded-xl shadow-2xl border border-ocean-medium/30 dark:border-starlight/30 backdrop-blur-sm animate-breathe-slow">
        <div className="text-center">
          <img
            src="/manifest-logo.png"
            alt="Manifest"
            className="mx-auto h-32 w-auto mb-4 animate-float"
          />
          <h2 className="text-3xl font-extrabold text-ocean-text dark:text-ocean-text-dark">
            Welcome to Manifest
          </h2>
          <p className="mt-2 text-sm text-ocean-muted dark:text-ocean-muted-dark">
            Sign in to access your inventory system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-ocean-medium/30 dark:border-starlight/30 placeholder-ocean-muted dark:placeholder-ocean-muted-dark text-ocean-text dark:text-ocean-text-dark bg-foam dark:bg-ocean-deep/50 focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight focus:border-transparent transition-all duration-300"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-ocean-medium/30 dark:border-starlight/30 placeholder-ocean-muted dark:placeholder-ocean-muted-dark text-ocean-text dark:text-ocean-text-dark bg-foam dark:bg-ocean-deep/50 focus:outline-none focus:ring-2 focus:ring-ocean-accent dark:focus:ring-starlight focus:border-transparent transition-all duration-300"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/30 border border-red-700 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white font-semibold bg-ocean-accent dark:bg-starlight hover:bg-ocean-medium dark:hover:bg-starlight-glow dark:animate-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-accent dark:focus:ring-starlight transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-ocean-muted dark:text-ocean-muted-dark">
            Don't have an account?{' '}
            <a
              href="/signup/wizard"
              className="font-semibold text-ocean-accent dark:text-starlight hover:text-ocean-medium dark:hover:text-starlight-glow transition-colors duration-300"
            >
              Start your free trial
            </a>
          </p>
          <p className="text-xs text-ocean-muted dark:text-ocean-muted-dark mt-2">
            14-day free trial • No credit card required to start
          </p>
        </div>
      </div>
    </div>
  );
}
