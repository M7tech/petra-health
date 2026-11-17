'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminStats, ManagerScope } from '@petra/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AlertTriangle } from 'lucide-react';
import { BarList, Button, Card, EmptyState, ErrorBanner, Input, PageHeader, StatTile, StatusBadge, TableSkeleton } from '@/components/ui';

const WHATSAPP_PATTERN = /^\+\d{6,15}$/;

export default function OverviewPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [scope, setScope] = useState<ManagerScope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
    api<ManagerScope>('/admin/me')
      .then((s) => {
        setScope(s);
        setWhatsapp(s.whatsappPhone ?? '');
      })
      .catch(() => {});
  }, [session]);

  async function saveWhatsapp(e: FormEvent) {
    e.preventDefault();
    setWhatsappError(null);
    if (!WHATSAPP_PATTERN.test(whatsapp)) {
      setWhatsappError('Enter a full international number, e.g. +9647500000000');
      return;
    }
    setWhatsappBusy(true);
    try {
      await api('/admin/me', { method: 'PUT', body: JSON.stringify({ whatsappPhone: whatsapp }) });
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 2500);
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setWhatsappBusy(false);
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Overview" />
        <ErrorBanner message={error} />
      </>
    );
  }
  if (!stats) {
    return (
      <>
        <PageHeader title="Overview" />
        <TableSkeleton />
      </>
    );
  }

  const total = Math.max(1, stats.adherence.onTime + stats.adherence.overdue + stats.adherence.notStarted);
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <>
      <PageHeader title="Overview" subtitle="Treatment adherence and programme reach" />

      {stats.adherence.overdue > 0 && (
        <Link
          href="/dashboard/patients"
          className="mb-6 flex items-center justify-between gap-3 rounded-panel border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition hover:bg-amber-100"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {stats.adherence.overdue} {stats.adherence.overdue === 1 ? 'patient has' : 'patients have'} an overdue injection
          </span>
          <span className="shrink-0 font-medium">View patients</span>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total patients" value={stats.totalPatients} hint={stats.genderBreakdown.unspecified ? `${stats.genderBreakdown.male} male · ${stats.genderBreakdown.female} female · ${stats.genderBreakdown.unspecified} unspecified` : `${stats.genderBreakdown.male} male · ${stats.genderBreakdown.female} female`} />
        <StatTile label="Injections on time" value={stats.adherence.onTime} hint={`${stats.adherence.notStarted} not started`} />
        <StatTile label="Total weight lost" value={`${stats.totalKgLost} kg`} hint="all patients" />
        <StatTile label="Doctors" value={stats.totalDoctors} hint={`${stats.totalCities} cities · ${stats.totalCountries} ${stats.totalCountries === 1 ? 'country' : 'countries'}`} />
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-slate-800">Adherence</h2>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${stats.adherence.onTime} on time, ${stats.adherence.overdue} overdue, ${stats.adherence.notStarted} not started`}>
          <div className="bg-emerald-500" style={{ width: pct(stats.adherence.onTime) }} />
          <div className="bg-red-500" style={{ width: pct(stats.adherence.overdue) }} />
          <div className="bg-slate-300" style={{ width: pct(stats.adherence.notStarted) }} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <li><span className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />On time <b className="tabular-nums">{stats.adherence.onTime}</b></li>
          <li><span className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Overdue <b className="tabular-nums">{stats.adherence.overdue}</b></li>
          <li><span className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />Not started <b className="tabular-nums">{stats.adherence.notStarted}</b></li>
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          {stats.totalDosesLogged} doses logged · {stats.totalMedicationsEnrolled} medications enrolled · {stats.totalWeightEntries} weight entries
        </p>
      </Card>

      {scope && !scope.isSuperAdmin && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Your region{scope.officeName ? ` — ${scope.officeName}` : ''}</h2>
            <Link href="/dashboard/patients" className="text-sm font-medium text-petra-600 hover:underline">View patients</Link>
          </div>
          {scope.cities.length === 0 ? (
            <p className="text-sm text-slate-500">No cities assigned yet. Ask a super-admin to assign you one.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {scope.cities.map((c) => (
                  <StatusBadge key={c.id} tone="brand">{c.name}, {c.countryName}</StatusBadge>
                ))}
              </div>
              <p className="text-sm text-slate-600">
                <b className="tabular-nums">{scope.doctors.length}</b> doctors · <b className="tabular-nums">{scope.patientCount}</b> patients
              </p>
            </>
          )}
        </Card>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BarList title="Patients by city" data={stats.patientsByCity} empty="No patients yet." />
        <BarList title="Doctors by city" data={stats.doctorsByCity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 !p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold text-slate-800">Recent sign-ups</h2>
            <Link href="/dashboard/patients" className="text-sm font-medium text-petra-600 hover:underline">View all</Link>
          </div>
          {stats.recentPatients.length === 0 ? (
            <EmptyState title="No patients yet" hint="New sign-ups from the app appear here." />
          ) : (
            <div className="table-wrap mt-3">
              <table>
                <tbody>
                  {stats.recentPatients.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-800">{p.fullName}</td>
                      <td className="text-slate-500">{p.email}</td>
                      <td className="text-right text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-slate-800">Your WhatsApp number</h2>
          <p className="mb-3 text-sm text-slate-500">Login codes and password-reset links are sent here.</p>
          <form onSubmit={saveWhatsapp} className="space-y-2">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+9647500000000" aria-label="WhatsApp number" inputMode="tel" />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={whatsappBusy}>{whatsappBusy ? 'Saving…' : 'Save number'}</Button>
              {whatsappSaved && <span className="text-sm text-emerald-600" role="status">Saved</span>}
            </div>
          </form>
          {whatsappError && <p className="mt-2 text-sm text-red-600" role="alert">{whatsappError}</p>}
        </Card>
      </div>
    </>
  );
}
