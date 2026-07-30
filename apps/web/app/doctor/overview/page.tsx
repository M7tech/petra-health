'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DoctorStats } from '@petra/shared';
import { api } from '@/lib/api';
import { BarList, Card, PageHeader, StatTile } from '@/components/ui';

export default function DoctorOverviewPage() {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DoctorStats>('/doctor/stats')
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

  const treatmentData = [
    { label: 'Ongoing', count: stats.treatmentStatus.ongoing },
    { label: 'Completed', count: stats.treatmentStatus.completed },
    { label: 'Discontinued', count: stats.treatmentStatus.discontinued },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        action={
          <Link href="/doctor/patients" className="text-sm font-medium text-petra-600 hover:underline">
            View all patients →
          </Link>
        }
      />

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
        <StatTile label="Total weight lost" value={`${stats.totalKgLost} kg`} hint="all your patients" />
        <StatTile
          label="Avg. HbA1c change"
          value={stats.avgHba1cChange == null ? '—' : `${stats.avgHba1cChange > 0 ? '+' : ''}${stats.avgHba1cChange}%`}
          hint={stats.avgHba1cChange == null ? 'need 2+ readings' : stats.avgHba1cChange < 0 ? 'improving' : undefined}
        />
        <StatTile label="Adverse events reported" value={stats.totalAdverseEvents} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BarList title="Treatment status" data={treatmentData} />
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Recent sign-ups</h2>
          {stats.recentPatients.length === 0 ? (
            <p className="text-sm text-slate-400">No patients yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {stats.recentPatients.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">
                      <Link href={`/doctor/patients/${p.id}`} className="hover:underline">
                        {p.fullName}
                      </Link>
                    </td>
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
      </div>
    </>
  );
}
