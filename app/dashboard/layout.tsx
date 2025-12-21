import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-tron-black flex flex-col transition-colors duration-200">
      <Navigation
        role={session.user.role}
        userName={session.user.name}
        vehicleNumber={session.user.vehicleNumber}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-sherbet-orange/20 dark:border-gray-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-600 dark:text-gray-500 text-center">
            © 2025 Lysara LLC. All rights reserved. Licensed software. Unauthorized use or distribution prohibited.
          </p>
        </div>
      </footer>
    </div>
  );
}
