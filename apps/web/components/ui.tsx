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
