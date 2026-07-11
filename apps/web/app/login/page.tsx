'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>('admin');
  const [email, setEmail] = useState('admin@petrapharma.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickRole(r: Role) {
    setRole(r);
    setEmail(r === 'admin' ? 'admin@petrapharma.com' : 'sara@petrapharma.com');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await login({ email, password }, role);
      router.replace(s.role === 'admin' ? '/dashboard/overview' : '/doctor/patients');
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
          <h1 className="text-xl font-semibold text-slate-800">Petra Health Portal</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1">
          {(['admin', 'doctor'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pickRole(r)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition ${
                role === r ? 'bg-white text-petra-600 shadow' : 'text-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
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
        <p className="text-center text-xs text-slate-400">
          {role === 'admin'
            ? 'Seed admin: admin@petrapharma.com / Admin123!'
            : 'Seed doctor: sara@petrapharma.com / Doctor123!'}
        </p>
      </form>
    </main>
  );
}
