'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminStats } from '@petra/shared';
import { api } from '@/lib/api';
import { BarList, Card, PageHeader, StatTile } from '@/components/ui';

export default function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

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

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Total patients" value={stats.totalPatients} />
        <StatTile label="Total doctors" value={stats.totalDoctors} />
        <StatTile label="Doses logged" value={stats.totalDosesLogged} />
        <StatTile label="Medications enrolled" value={stats.totalMedicationsEnrolled} />
        <StatTile label="Cities" value={stats.totalCities} hint={`${stats.totalCountries} countries`} />
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
