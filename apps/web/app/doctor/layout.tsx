'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.role !== 'doctor')) router.replace('/login');
  }, [session, loading, router]);

  if (loading || !session || session.role !== 'doctor') {
    return <main className="flex min-h-screen items-center justify-center text-slate-400">Loading…</main>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-petra-500 text-sm font-bold text-white">
            8
          </span>
          <span className="font-semibold text-slate-800">Petra Health · Doctor</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-medium text-slate-700">{session.fullName}</p>
            <p className="text-xs text-slate-400">{session.subtitle}</p>
          </div>
          <button onClick={logout} className="text-petra-600 hover:underline">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
