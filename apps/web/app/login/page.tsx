'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, Role } from '@/lib/auth';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function LoginPage() {
  const { doctorLogin, adminRequestOtp, adminVerifyOtp } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>('admin');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  const [username, setUsername] = useState('superadmin');
  const [email, setEmail] = useState('sara@petrapharma.com');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickRole(r: Role) {
    setRole(r);
    setStep('credentials');
    setError(null);
    setDevOtp(null);
  }

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (role === 'doctor') {
        await doctorLogin(email.trim(), password);
        router.replace('/doctor/overview');
      } else {
        const res = await adminRequestOtp(username.trim(), password);
        setSentTo(res.sentTo ?? null);
        setDevOtp(res.devOtp ?? null);
        setStep('otp');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await adminVerifyOtp(username.trim(), otp.trim(), rememberMe);
      router.replace(s.isSuperAdmin ? '/dashboard/overview' : '/dashboard/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <img src="/logo-mark.png" alt="Petra Pharma" className="mx-auto mb-3 h-14 w-14" />
          <h1 className="text-xl font-semibold text-slate-800">Petra Health Portal</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>

        {step === 'credentials' && (
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
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} className="space-y-4">
            {role === 'admin' ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">Username</span>
                <input required value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
              </label>
            ) : (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Password</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </label>
            {role === 'admin' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <Link href="/forgot" className="text-petra-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-petra-500 py-2.5 font-medium text-white transition hover:bg-petra-600 disabled:opacity-60"
            >
              {busy ? 'Please wait…' : role === 'admin' ? 'Continue' : 'Sign in'}
            </button>
            <p className="text-center text-xs text-slate-400">
              {role === 'admin'
                ? 'Super-admin: superadmin / Admin123! · Manager: manager1 / Manager123!'
                : 'Doctor: sara@petrapharma.com / Doctor123!'}
            </p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter the 6-digit code{sentTo ? ` sent to ${sentTo}` : ''}.
            </p>
            {devOtp && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Email isn&apos;t configured yet — your code is <b>{devOtp}</b>
              </p>
            )}
            <input
              autoFocus
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`${inputCls} text-center text-lg tracking-[0.4em]`}
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-petra-500 py-2.5 font-medium text-white transition hover:bg-petra-600 disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setOtp(''); setError(null); }}
              className="w-full text-center text-sm text-slate-500 hover:underline"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
