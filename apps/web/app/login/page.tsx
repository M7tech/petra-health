'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@petrapharma.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      router.replace('/dashboard/countries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-petra-500 text-lg font-bold text-white">
            8
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Petra Health Admin</h1>
          <p className="text-sm text-slate-500">Sign in to manage the directory</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-petra-500 py-2.5 font-medium text-white transition hover:bg-petra-600 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-xs text-slate-400">Seed admin: admin@petrapharma.com / Admin123!</p>
      </form>
    </main>
  );
}
