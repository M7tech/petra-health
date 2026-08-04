'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/doctor/overview', label: 'Overview' },
  { href: '/doctor/patients', label: 'My Patients' },
  { href: '/doctor/content', label: 'Training & News' },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
          <img src="/logo-mark.png" alt="" className="h-8 w-8" />
          <span className="font-semibold text-slate-800">Petra Health · Doctor</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-petra-50 text-petra-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
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
