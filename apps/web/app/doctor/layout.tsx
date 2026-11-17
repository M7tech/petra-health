'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppShell, { DOCTOR_NAV } from '@/components/AppShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.role !== 'doctor')) router.replace('/login');
  }, [session, loading, router]);

  if (loading || !session || session.role !== 'doctor') {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400" role="status">
        Loading…
      </main>
    );
  }

  return (
    <AppShell nav={DOCTOR_NAV} session={session} logout={logout}>
      {children}
    </AppShell>
  );
}
