/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Server-side ADMIN role enforcement
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
