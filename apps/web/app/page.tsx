'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(admin ? '/dashboard/overview' : '/login');
  }, [admin, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-slate-400">
      Loading…
    </main>
  );
}
