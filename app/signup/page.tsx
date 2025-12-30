'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to wizard - this is now the new signup flow
export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/signup/wizard');
  }, [router]);

  return (
    <div className="min-h-screen bg-ocean-gradient dark:bg-ocean-night flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-accent dark:border-starlight mx-auto mb-4"></div>
        <p className="text-ocean-text dark:text-ocean-text-dark">Redirecting to signup...</p>
      </div>
    </div>
  );
}
