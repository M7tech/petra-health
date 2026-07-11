'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/dashboard/overview', label: 'Overview' },
  { href: '/dashboard/patients', label: 'Patients' },
  { href: '/dashboard/countries', label: 'Countries' },
  { href: '/dashboard/cities', label: 'Cities' },
  { href: '/dashboard/doctors', label: 'Doctors' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!session || session.role !== 'admin')) router.replace('/login');
  }, [session, loading, router]);

  if (loading || !session || session.role !== 'admin') {
    return <main className="flex min-h-screen items-center justify-center text-slate-400">Loading…</main>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col justify-between bg-white p-5 shadow-sm">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-petra-500 text-sm font-bold text-white">
              8
            </span>
            <span className="font-semibold text-slate-800">Petra Health</span>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-petra-50 text-petra-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t pt-4 text-sm">
          <p className="font-medium text-slate-700">{session.fullName}</p>
          <p className="mb-2 text-xs text-slate-400">{session.subtitle}</p>
          <button onClick={logout} className="text-petra-600 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
