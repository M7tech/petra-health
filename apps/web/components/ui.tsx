'use client';

import { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-petra-500 text-white hover:bg-petra-600 active:bg-petra-700',
    ghost: 'bg-white text-slate-700 shadow-panel hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200',
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

const fieldCls =
  'min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20 disabled:bg-slate-50 disabled:text-slate-400';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldCls} ${props.className ?? ''}`} />;
}

// Visible label above a field, with optional helper or error text beneath it.
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-panel bg-white p-5 shadow-panel ${className}`}>{children}</div>;
}

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export function StatusBadge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
    brand: 'bg-petra-50 text-petra-700',
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} aria-hidden />;
}

// Loading placeholder for table panels — keeps layout from jumping.
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

// KPI stat tile — a hero number, no plot (per dataviz form guidance).
export function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-panel bg-white p-4 shadow-panel sm:p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Single-series magnitude: one hue, value labels in ink, no legend.
export function BarList({
  title,
  data,
  empty = 'No data yet.',
}: {
  title: string;
  data: { label: string; count: number }[];
  empty?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-800">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate text-slate-600" title={d.label}>
                {d.label}
              </span>
              <div className="h-5 flex-1 rounded bg-slate-100">
                <div
                  className="h-5 rounded bg-petra-500"
                  style={{ width: `${Math.max(6, (d.count / max) * 100)}%` }}
                  role="img"
                  aria-label={`${d.label}: ${d.count}`}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-medium tabular-nums text-slate-700">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
