'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DoctorPatientSummary } from '@petra/shared';
import { api } from '@/lib/api';

const STATUS_STYLE: Record<string, string> = {
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-200 text-slate-700',
  DISCONTINUED: 'bg-red-100 text-red-700',
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DoctorPatientSummary[]>('/doctor/patients')
      .then(setPatients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold text-slate-800">My patients</h1>
      <p className="mb-6 text-sm text-slate-500">Patients who selected you as their treating doctor.</p>

      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Age / Sex</th>
                <th className="pb-2 text-right">Weight</th>
                <th className="pb-2 text-right">BMI</th>
                <th className="pb-2 text-right">Events</th>
                <th className="pb-2 text-center">Treatment</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 font-medium text-petra-700">
                    <Link href={`/doctor/patients/${p.id}`} className="hover:underline">
                      {p.fullName}
                    </Link>
                  </td>
                  <td className="py-2.5 text-slate-500">
                    {p.age ?? '—'} · {p.gender ? p.gender[0] : '—'}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">
                    {p.latestWeightKg != null ? `${p.latestWeightKg} kg` : '—'}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">
                    {p.bmi ?? '—'}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">
                    {p.adverseEventCount}
                  </td>
                  <td className="py-2.5 text-center">
                    {p.treatmentStatus ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[p.treatmentStatus]
                        }`}
                      >
                        {p.treatmentStatus.toLowerCase()}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No patients have selected you yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
