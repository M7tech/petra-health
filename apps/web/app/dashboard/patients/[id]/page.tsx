'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PatientDetail } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader, StatTile } from '@/components/ui';
import { WeightChart } from '@/components/WeightChart';

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [p, setP] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    api<PatientDetail>(`/admin/patients/${params.id}`)
      .then(setP)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [params.id]);

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!p) return <p className="text-slate-400">Loading…</p>;

  return (
    <>
      <Link href="/dashboard/patients" className="text-sm text-petra-600 hover:underline">
        ← All patients
      </Link>
      <PageHeader title={p.fullName} />
      <p className="-mt-4 mb-6 text-slate-500">
        {p.email} · {[p.cityName, p.countryName].filter(Boolean).join(', ') || 'No location'} ·
        Doctor: {p.doctorName ?? '—'}
      </p>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatTile label="Medications" value={p.medicationCount} />
        <StatTile label="Doses logged" value={p.doseCount} />
        <StatTile label="Weight entries" value={p.weightEntries.length} />
      </div>

      <div className="mb-6">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Weight trend</h2>
          <WeightChart data={p.weightEntries} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Medications</h2>
          {p.medications.length === 0 ? (
            <p className="text-sm text-slate-400">None enrolled.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.medications.map((m) => (
                <li key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700">
                      {m.name} {!m.active && <span className="text-slate-400">(inactive)</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {[m.dosage, m.frequency].filter(Boolean).join(' · ') || '—'} · since{' '}
                      {new Date(m.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="tabular-nums text-slate-500">{m.doseCount} doses</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Recent doses</h2>
          {p.recentDoses.length === 0 ? (
            <p className="text-sm text-slate-400">No doses logged.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {p.recentDoses.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-1.5 text-slate-700">{d.medicationName}</td>
                    <td className="py-1.5 text-slate-500">
                      {d.doseMg != null ? `${d.doseMg} mg` : '—'}
                    </td>
                    <td className="py-1.5 text-right text-slate-400">
                      {new Date(d.takenAt).toLocaleDateString()}
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
