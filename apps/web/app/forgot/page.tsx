'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function ForgotPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ ok: true; devToken?: string }>('/auth/admin/forgot', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: id.trim() }),
      });
      setDevToken(res.devToken ?? null);
      setDone(true);
    } catch {
      setDone(true); // never reveal whether the account exists
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-800">Forgot password</h1>
        {done ? (
          <>
            <p className="text-sm text-slate-600">
              If that account exists, we&apos;ve sent a reset link to its email.
            </p>
            {devToken && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Email isn&apos;t configured yet — reset directly:{' '}
                <Link href={`/reset?token=${devToken}`} className="font-medium underline">
                  open reset link
                </Link>
              </p>
            )}
            <Link href="/login" className="block text-center text-sm text-petra-600 hover:underline">
              ← Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-500">Enter your username or email.</p>
            <input required value={id} onChange={(e) => setId(e.target.value)} className={inputCls} placeholder="username or email" />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-petra-500 py-2.5 font-medium text-white hover:bg-petra-600 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="block text-center text-sm text-slate-500 hover:underline">
              ← Back
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
