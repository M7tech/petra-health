'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/login');
    else router.replace(session.role === 'admin' ? '/dashboard/overview' : '/doctor/patients');
  }, [session, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-slate-400">
      Loading…
    </main>
  );
}
