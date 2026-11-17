'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { PatientSummary } from '@petra/shared';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card, EmptyState, ErrorBanner, Input, PageHeader, TableSkeleton } from '@/components/ui';

// Case/script-agnostic match so Latin, Arabic and Kurdish names all work.
const norm = (s: string) => s.normalize('NFKC').toLowerCase();

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { t } = useI18n();

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
        title={t('patients.title')}
        subtitle={patients.length ? `${shown.length} of ${patients.length} shown` : undefined}
        action={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('patients.searchPh')}
              aria-label={t('patients.searchPh')}
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
            title={patients.length === 0 ? t('patients.none') : t('patients.noMatch')}
            hint={patients.length === 0 ? 'Patients appear here once they sign up in the app.' : 'Try a different name, city or doctor.'}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('patients.name')}</th>
                  <th>{t('patients.email')}</th>
                  <th>{t('patients.location')}</th>
                  <th>{t('patients.doctor')}</th>
                  <th className="text-end">{t('patients.meds')}</th>
                  <th className="text-end">{t('patients.doses')}</th>
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
                    <td className="text-end text-slate-600">{p.medicationCount}</td>
                    <td className="text-end text-slate-600">{p.doseCount}</td>
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
