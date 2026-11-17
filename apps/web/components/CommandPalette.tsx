'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { NavGroup } from './AppShell';

const norm = (s: string) => s.normalize('NFKC').toLowerCase();

interface Hit {
  id: string;
  label: string;
  sub?: string;
  href: string;
  kind: 'page' | 'patient';
}

// Ctrl/Cmd+K: jump to any page or patient. Patients load once, on first open.
export default function CommandPalette({
  open,
  onClose,
  nav,
  patientsPath,
  patientHref,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavGroup[];
  patientsPath: string;
  patientHref: (id: string) => string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<{ id: string; fullName: string; email: string }[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    setTimeout(() => input.current?.focus(), 0);
    if (patients === null) {
      api<{ id: string; fullName: string; email: string }[]>(patientsPath)
        .then(setPatients)
        .catch(() => setPatients([]));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hits = useMemo<Hit[]>(() => {
    const q = norm(query.trim());
    const pages: Hit[] = nav.flatMap((g) =>
      g.items.map((i) => ({ id: i.href, label: t(i.key), href: i.href, kind: 'page' as const })),
    );
    const pats: Hit[] = (patients ?? []).map((p) => ({ id: p.id, label: p.fullName, sub: p.email, href: patientHref(p.id), kind: 'patient' as const }));
    const match = (h: Hit) => !q || norm(h.label).includes(q) || (h.sub ? norm(h.sub).includes(q) : false);
    return [...pages.filter(match), ...(q ? pats.filter(match).slice(0, 8) : [])];
  }, [query, nav, patients, patientHref, t]);

  useEffect(() => setCursor(0), [query]);

  function go(h: Hit) {
    onClose();
    router.push(h.href);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t('shell.search')}>
      <button className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-panel bg-white shadow-pop">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4">
          <Search className="h-4 w-4 text-slate-400" aria-hidden />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === 'Enter' && hits[cursor]) go(hits[cursor]);
            }}
            placeholder={t('shell.search')}
            aria-label={t('shell.search')}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 focus-visible:!ring-0 focus-visible:!ring-offset-0"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 sm:block">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">{t('shell.noResults')}</li>}
          {hits.map((h, i) => (
            <li key={`${h.kind}-${h.id}`} role="option" aria-selected={i === cursor}>
              <button
                onClick={() => go(h)}
                onMouseEnter={() => setCursor(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm ${i === cursor ? 'bg-petra-50 text-petra-700' : 'text-slate-700'}`}
              >
                {h.kind === 'patient' ? <User className="h-4 w-4 shrink-0" aria-hidden /> : <Search className="h-4 w-4 shrink-0 opacity-0" aria-hidden />}
                <span className="truncate font-medium">{h.label}</span>
                {h.sub && <span className="truncate text-xs text-slate-500">{h.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
