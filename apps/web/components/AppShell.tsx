'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, Building2, ChevronsLeft, ChevronsRight, FileBarChart, Globe2, LayoutDashboard, LogOut, MapPin, Menu,
  MessageSquare, Moon, Settings, Stethoscope, Sun, UserCog, Users, X, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Care',
    items: [
      { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/map', label: 'Map', icon: MapPin },
      { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
      { href: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
      { href: '/dashboard/content', label: 'Training & News', icon: BookOpen },
    ],
  },
  {
    title: 'Directory',
    items: [
      { href: '/dashboard/countries', label: 'Countries', icon: Globe2 },
      { href: '/dashboard/cities', label: 'Cities', icon: Building2 },
      { href: '/dashboard/doctors', label: 'Doctors', icon: Stethoscope },
    ],
  },
];

export const SUPER_ADMIN_NAV: NavGroup = {
  title: 'Administration',
  items: [
    { href: '/dashboard/users', label: 'Users', icon: UserCog },
    { href: '/dashboard/pharmacies', label: 'Pharmacies', icon: Building2 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
};

export const DOCTOR_NAV: NavGroup[] = [
  {
    title: 'My practice',
    items: [
      { href: '/doctor/overview', label: 'Overview', icon: LayoutDashboard },
      { href: '/doctor/patients', label: 'My Patients', icon: Users },
      { href: '/doctor/content', label: 'Training & News', icon: BookOpen },
    ],
  },
];

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('petra_theme', next ? 'dark' : 'light');
    } catch {
      /* private mode — theme just won't persist */
    }
  };
  return { dark, toggle };
}

// The console frame: collapsible sidebar on desktop, drawer on phones, slim top bar.
export default function AppShell({
  nav,
  session,
  logout,
  children,
}: {
  nav: NavGroup[];
  session: { fullName: string; subtitle?: string };
  logout: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('petra_nav_collapsed') === '1');
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => setDrawer(false), [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('petra_nav_collapsed', c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const current = nav.flatMap((g) => g.items).find((i) => pathname === i.href || pathname?.startsWith(`${i.href}/`));

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className={`flex h-14 items-center gap-2.5 border-b border-white/10 ${compact ? 'justify-center px-2' : 'px-4'}`}>
        <img src="/logo-mark.png" alt="" className="h-7 w-7 rounded bg-white p-0.5" />
        {!compact && <span className="text-sm font-semibold text-white">Petra Health</span>}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Main">
        {nav.map((group) => (
          <div key={group.title}>
            {!compact && <p className="mb-1.5 px-3 text-xs font-medium text-slate-500">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={compact ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                        compact ? 'justify-center' : ''
                      } ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
                    >
                      {active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-petra-400" />}
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!compact && <span className="truncate">{item.label}</span>}
                      {compact && <span className="sr-only">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-30 hidden transition-[width] duration-200 lg:block ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {sidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setDrawer(false)} aria-label="Close navigation" />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] shadow-pop">{sidebar(false)}</div>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:ps-[72px]' : 'lg:ps-64'}`}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation">
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
          <p className="truncate text-sm font-medium text-slate-700">{current?.label}</p>

          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="hidden text-end sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">{session.fullName}</p>
              {session.subtitle && <p className="text-xs leading-tight text-slate-500">{session.subtitle}</p>}
            </div>
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
