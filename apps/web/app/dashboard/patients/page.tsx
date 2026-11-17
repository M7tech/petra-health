'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { PatientSummary } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, EmptyState, ErrorBanner, Input, PageHeader, TableSkeleton } from '@/components/ui';

// Case/script-agnostic match so Latin, Arabic and Kurdish names all work.
const norm = (s: string) => s.normalize('NFKC').toLowerCase();

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api<PatientSummary[]>('/admin/patients')
      .then(setPatients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return patients;
    return patients.filter((p) =>
      [p.fullName, p.email, p.cityName, p.countryName, p.doctorName].some((v) => v && norm(v).includes(q)),
    );
  }, [patients, query]);

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={patients.length ? `${shown.length} of ${patients.length} shown` : undefined}
        action={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, city or doctor"
              aria-label="Search patients"
              className="ps-9"
            />
          </div>
        }
      />
      {error && <ErrorBanner message={error} />}
      <Card className="!p-0">
        {loading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title={patients.length === 0 ? 'No patients yet' : 'No patients match your search'}
            hint={patients.length === 0 ? 'Patients appear here once they sign up in the app.' : 'Try a different name, city or doctor.'}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Doctor</th>
                  <th className="text-right">Meds</th>
                  <th className="text-right">Doses</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      <Link href={`/dashboard/patients/${p.id}`} className="text-petra-700 hover:underline">
                        {p.fullName}
                      </Link>
                    </td>
                    <td className="text-slate-500">{p.email}</td>
                    <td className="text-slate-500">{[p.cityName, p.countryName].filter(Boolean).join(', ') || '—'}</td>
                    <td className="text-slate-500">{p.doctorName ?? '—'}</td>
                    <td className="text-right text-slate-600">{p.medicationCount}</td>
                    <td className="text-right text-slate-600">{p.doseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
