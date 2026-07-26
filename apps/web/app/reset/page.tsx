'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function ResetPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Read token from the URL without useSearchParams (avoids a Suspense boundary).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (t) setToken(t);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/auth/admin/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
      setDone(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-800">Set a new password</h1>
        {done ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Password updated. Redirecting to sign in…
          </p>
        ) : !token ? (
          <p className="text-sm text-slate-500">
            Missing or invalid reset link.{' '}
            <Link href="/forgot" className="text-petra-600 hover:underline">
              Request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">New password</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-petra-500 py-2.5 font-medium text-white hover:bg-petra-600 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
