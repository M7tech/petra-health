'use client';

import { ReactNode } from 'react';

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
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
    primary: 'bg-petra-500 text-white hover:bg-petra-600',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${styles} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20 ${props.className ?? ''}`}
    />
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm">{children}</div>;
}

// KPI stat tile — a hero number, no plot (per dataviz form guidance).
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
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
      <h2 className="mb-4 font-semibold text-slate-700">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
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
              <span className="w-8 shrink-0 text-right font-medium tabular-nums text-slate-700">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
