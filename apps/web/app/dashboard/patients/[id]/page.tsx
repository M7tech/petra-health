'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { PatientDetail } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, EmptyState, ErrorBanner, PageHeader, StatTile, StatusBadge, TableSkeleton } from '@/components/ui';
import { WeightChart } from '@/components/WeightChart';
import { MetricChart } from '@/components/MetricChart';

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-700">{v}</dd>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [p, setP] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'clinical' | 'treatment'>('overview');

  useEffect(() => {
    if (!params.id) return;
    api<PatientDetail>(`/admin/patients/${params.id}`)
      .then(setP)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [params.id]);

  if (error) return <ErrorBanner message={error} />;
  if (!p) return <TableSkeleton />;

  const status = p.assessment?.treatmentStatus;
  const statusTone = status === 'ONGOING' ? 'success' : status === 'DISCONTINUED' ? 'danger' : 'neutral';

  return (
    <>
      <Link href="/dashboard/patients" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-petra-600 hover:underline">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> All patients
      </Link>
      <PageHeader
        title={p.fullName}
        subtitle={`${p.email} · ${[p.cityName, p.countryName].filter(Boolean).join(', ') || 'No location'} · Doctor: ${p.doctorName ?? '—'}`}
        action={status ? <StatusBadge tone={statusTone}>{status.toLowerCase()}</StatusBadge> : undefined}
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile label="Medications" value={p.medicationCount} />
        <StatTile label="Doses logged" value={p.doseCount} />
        <StatTile label="Weight entries" value={p.weightEntries.length} />
      </div>

      <div role="tablist" aria-label="Patient sections" className="mb-6 flex gap-1 border-b border-slate-200">
        {([['overview', 'Overview'], ['clinical', 'Clinical'], ['treatment', 'Treatment']] as const).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === k ? 'border-petra-500 text-petra-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Weight trend (kg)</h2>
          <WeightChart data={p.weightEntries} />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">HbA1c trend (%)</h2>
          <MetricChart data={p.hba1cEntries} color="#0284c7" unit="%" empty="No HbA1c readings yet." />
        </Card>
      </div>
      )}

      {tab === 'clinical' && !(p.assessment || p.adverseEvents.length > 0 || p.comments.length > 0) && (
        <Card><EmptyState title="No clinical follow-up yet" hint="Assessments, adverse events and doctor comments appear here once recorded." /></Card>
      )}
      {tab === 'clinical' && (p.assessment || p.adverseEvents.length > 0 || p.comments.length > 0) && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-700">Clinical follow-up</h2>
            {p.assessment ? (
              <dl className="space-y-1.5 text-sm">
                <Row k="Treatment" v={p.assessment.treatmentStatus.toLowerCase()} />
                <Row k="Diabetes duration" v={p.assessment.diabetesDuration} />
                <Row k="Baseline HbA1c" v={p.assessment.baselineHba1c != null ? `${p.assessment.baselineHba1c}%` : null} />
                <Row k="Starting dose" v={p.assessment.startingDose} />
                <Row k="Concomitant meds" v={p.assessment.concomitantMeds} />
                <Row k="Discontinuation" v={p.assessment.discontinuationReason} />
                <Row k="Physician comments" v={p.assessment.physicianComments} />
              </dl>
            ) : (
              <p className="text-sm text-slate-400">No assessment recorded.</p>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold text-slate-700">
              Adverse events ({p.adverseEvents.length})
            </h2>
            {p.adverseEvents.length === 0 ? (
              <p className="text-sm text-slate-400">None reported.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {p.adverseEvents.map((e) => (
                  <li key={e.id} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="text-slate-700">
                      <span className="text-xs uppercase text-slate-400">{e.severity}</span> · {e.description}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(e.onsetDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'treatment' && (
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
            <div className="table-wrap"><table>
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
            </table></div>
          )}
        </Card>
      </div>
      )}
    </>
  );
}
