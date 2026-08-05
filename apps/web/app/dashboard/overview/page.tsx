'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminStats, ManagerScope } from '@petra/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BarList, Card, PageHeader, StatTile } from '@/components/ui';

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
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      </>
    );
  }
  if (!stats) {
    return (
      <>
        <PageHeader title="Overview" />
        <p className="text-slate-400">Loading…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Overview" />

      <div className="mb-6">
        <Card>
          <h2 className="mb-1 font-semibold text-slate-700">Your WhatsApp number</h2>
          <p className="mb-3 text-sm text-slate-500">
            Login codes and password-reset links are sent here via WhatsApp.
          </p>
          <form onSubmit={saveWhatsapp} className="flex flex-wrap items-center gap-2">
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+9647500000000"
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20"
            />
            <button
              type="submit"
              disabled={whatsappBusy}
              className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60"
            >
              {whatsappBusy ? 'Saving…' : 'Save'}
            </button>
            {whatsappSaved && <span className="text-sm text-green-600">Saved ✓</span>}
          </form>
          {whatsappError && <p className="mt-2 text-sm text-red-600">{whatsappError}</p>}
        </Card>
      </div>

      {scope && !scope.isSuperAdmin && (
        <div className="mb-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">
                Your region{scope.officeName ? ` — ${scope.officeName}` : ''}
              </h2>
              <Link href="/dashboard/patients" className="text-sm font-medium text-petra-600 hover:underline">
                View patients →
              </Link>
            </div>
            {scope.cities.length === 0 ? (
              <p className="text-sm text-slate-400">
                No cities assigned yet — ask a super-admin to assign you one.
              </p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {scope.cities.map((c) => (
                    <span key={c.id} className="rounded-full bg-petra-50 px-3 py-1 text-xs font-medium text-petra-700">
                      {c.name}, {c.countryName}
                    </span>
                  ))}
                </div>
                <div className="flex gap-6 text-sm text-slate-600">
                  <span>
                    <b className="tabular-nums">{scope.doctors.length}</b> doctors
                  </span>
                  <span>
                    <b className="tabular-nums">{scope.patientCount}</b> patients
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Total patients" value={stats.totalPatients} />
        <StatTile
          label="Male / Female"
          value={`${stats.genderBreakdown.male} / ${stats.genderBreakdown.female}`}
          hint={stats.genderBreakdown.unspecified ? `${stats.genderBreakdown.unspecified} unspecified` : undefined}
        />
        <StatTile
          label="Injections on time"
          value={stats.adherence.onTime}
          hint={`${stats.adherence.overdue} overdue · ${stats.adherence.notStarted} not started`}
        />
        <StatTile label="Total weight lost" value={`${stats.totalKgLost} kg`} hint="all patients" />
        <StatTile label="Total doctors" value={stats.totalDoctors} />
        <StatTile label="Doses logged" value={stats.totalDosesLogged} />
        <StatTile label="Medications enrolled" value={stats.totalMedicationsEnrolled} />
        <StatTile
          label="Cities"
          value={stats.totalCities}
          hint={`${stats.totalCountries} ${stats.totalCountries === 1 ? 'country' : 'countries'}`}
        />
        <StatTile label="Weight entries" value={stats.totalWeightEntries} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BarList title="Patients by city" data={stats.patientsByCity} empty="No patients yet." />
        <BarList title="Doctors by city" data={stats.doctorsByCity} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Recent sign-ups</h2>
          <Link href="/dashboard/patients" className="text-sm font-medium text-petra-600 hover:underline">
            View all patients →
          </Link>
        </div>
        {stats.recentPatients.length === 0 ? (
          <p className="text-sm text-slate-400">No patients yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {stats.recentPatients.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 font-medium text-slate-700">{p.fullName}</td>
                  <td className="py-2 text-slate-500">{p.email}</td>
                  <td className="py-2 text-right text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
