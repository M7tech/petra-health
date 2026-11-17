'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, LANGS } from '@/lib/i18n';
import CommandPalette from './CommandPalette';
import {
  BookOpen, Building2, ChevronsLeft, ChevronsRight, FileBarChart, Globe2, LayoutDashboard, LogOut, MapPin, Menu,
  MessageSquare, Moon, Search, Settings, Stethoscope, Sun, UserCog, Users, X, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  key: string;
  icon: LucideIcon;
}
export interface NavGroup {
  title: string;
  key: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Care', key: 'nav.care',
    items: [
      { href: '/dashboard/overview', label: 'Overview', key: 'nav.overview', icon: LayoutDashboard },
      { href: '/dashboard/patients', label: 'Patients', key: 'nav.patients', icon: Users },
      { href: '/dashboard/map', label: 'Map', key: 'nav.map', icon: MapPin },
      { href: '/dashboard/messages', label: 'Messages', key: 'nav.messages', icon: MessageSquare },
      { href: '/dashboard/reports', label: 'Reports', key: 'nav.reports', icon: FileBarChart },
      { href: '/dashboard/content', label: 'Training & News', key: 'nav.content', icon: BookOpen },
    ],
  },
  {
    title: 'Directory', key: 'nav.directory',
    items: [
      { href: '/dashboard/countries', label: 'Countries', key: 'nav.countries', icon: Globe2 },
      { href: '/dashboard/cities', label: 'Cities', key: 'nav.cities', icon: Building2 },
      { href: '/dashboard/doctors', label: 'Doctors', key: 'nav.doctors', icon: Stethoscope },
    ],
  },
];

export const SUPER_ADMIN_NAV: NavGroup = {
  title: 'Administration', key: 'nav.administration',
  items: [
    { href: '/dashboard/users', label: 'Users', key: 'nav.users', icon: UserCog },
    { href: '/dashboard/pharmacies', label: 'Pharmacies', key: 'nav.pharmacies', icon: Building2 },
    { href: '/dashboard/settings', label: 'Settings', key: 'nav.settings', icon: Settings },
  ],
};

export const DOCTOR_NAV: NavGroup[] = [
  {
    title: 'My practice', key: 'nav.practice',
    items: [
      { href: '/doctor/overview', label: 'Overview', key: 'nav.overview', icon: LayoutDashboard },
      { href: '/doctor/patients', label: 'My Patients', key: 'nav.myPatients', icon: Users },
      { href: '/doctor/content', label: 'Training & News', key: 'nav.content', icon: BookOpen },
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
  patientsPath,
  patientHref,
  children,
}: {
  nav: NavGroup[];
  patientsPath: string;
  patientHref: (id: string) => string;
  session: { fullName: string; subtitle?: string };
  logout: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [palette, setPalette] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
            {!compact && <p className="mb-1.5 px-3 text-xs font-medium text-slate-500">{t(group.key)}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={compact ? t(item.key) : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                        compact ? 'justify-center' : ''
                      } ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
                    >
                      {active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-petra-400" />}
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!compact && <span className="truncate">{t(item.key)}</span>}
                      {compact && <span className="sr-only">{t(item.key)}</span>}
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
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t('shell.openNav')}>
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setDrawer(false)} aria-label={t('shell.closeNav')} />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] shadow-pop">{sidebar(false)}</div>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:ps-[72px]' : 'lg:ps-64'}`}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label={t('shell.openNav')}>
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
          >
            {collapsed ? <ChevronsRight className="rtl-flip h-5 w-5" /> : <ChevronsLeft className="rtl-flip h-5 w-5" />}
          </button>
          <p className="truncate text-sm font-medium text-slate-700">{current ? t(current.key) : ''}</p>

          <button
            onClick={() => setPalette(true)}
            className="ms-2 hidden h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:bg-slate-50 md:flex"
            aria-label={t('shell.search')}
          >
            <Search className="h-4 w-4" aria-hidden />
            <span>{t('shell.searchHint')}</span>
            <kbd className="rounded border border-slate-200 px-1.5 text-xs">Ctrl K</kbd>
          </button>

          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setPalette(true)} aria-label={t('shell.search')}>
              <Search className="h-5 w-5" />
            </button>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              aria-label={t('shell.language')}
              className="h-9 rounded-lg border border-slate-200 bg-transparent px-2 text-sm text-slate-600"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={toggle} aria-label={dark ? t('shell.light') : t('shell.dark')}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="hidden text-end sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">{session.fullName}</p>
              {session.subtitle && <p className="text-xs leading-tight text-slate-500">{session.subtitle}</p>}
            </div>
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t('shell.signOut')}</span>
              <span className="sr-only sm:hidden">{t('shell.signOut')}</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} nav={nav} patientsPath={patientsPath} patientHref={patientHref} />
    </div>
  );
}
