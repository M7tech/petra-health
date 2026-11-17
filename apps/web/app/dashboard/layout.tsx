'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppShell, { ADMIN_NAV, SUPER_ADMIN_NAV } from '@/components/AppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.role !== 'admin')) router.replace('/login');
  }, [session, loading, router]);

  if (loading || !session || session.role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400" role="status">
        Loading…
      </main>
    );
  }

  // Only the super-admin can manage manager users, the pharmacy directory and settings.
  const nav = session.isSuperAdmin ? [...ADMIN_NAV, SUPER_ADMIN_NAV] : ADMIN_NAV;

  return (
    <AppShell nav={nav} session={session} logout={logout}>
      {children}
    </AppShell>
  );
}
