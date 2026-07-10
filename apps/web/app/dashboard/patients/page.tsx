'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PatientSummary } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PatientSummary[]>('/admin/patients')
      .then(setPatients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={`Patients${patients.length ? ` (${patients.length})` : ''}`} />
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <Card>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Doctor</th>
                <th className="pb-2 text-right">Meds</th>
                <th className="pb-2 text-right">Doses</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-medium text-petra-700">
                    <Link href={`/dashboard/patients/${p.id}`} className="hover:underline">
                      {p.fullName}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-500">{p.email}</td>
                  <td className="py-2 text-slate-500">
                    {[p.cityName, p.countryName].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-2 text-slate-500">{p.doctorName ?? '—'}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{p.medicationCount}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{p.doseCount}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No patients have signed up yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
