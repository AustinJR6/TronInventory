import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch company to get business model
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { businessModel: true },
  });

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-ocean-gradient-subtle dark:bg-ocean-night-subtle">
      <Navigation
        role={session.user.role}
        userName={session.user.name}
        vehicleNumber={session.user.vehicleNumber}
        businessModel={company?.businessModel || 'WAREHOUSE_ONLY'}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-ocean-medium/30 dark:border-starlight/20 py-4 mt-8 bg-white/50 dark:bg-ocean-dark/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-ocean-text dark:text-ocean-muted-dark text-center font-medium">
            © 2025 Lysara LLC. All rights reserved. Licensed software. Unauthorized use or distribution prohibited.
          </p>
        </div>
      </footer>
    </div>
  );
}
