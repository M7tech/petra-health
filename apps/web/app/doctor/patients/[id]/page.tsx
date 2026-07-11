'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type {
  ClinicalAssessment,
  DoctorPatientDetail,
  PatientComment,
  TreatmentStatus,
  UpsertAssessmentDto,
} from '@petra/shared';
import { api } from '@/lib/api';
import { Card, StatTile } from '@/components/ui';
import { WeightChart } from '@/components/WeightChart';

const SEVERITY_STYLE: Record<string, string> = {
  MILD: 'bg-green-100 text-green-700',
  MODERATE: 'bg-amber-100 text-amber-700',
  SEVERE: 'bg-red-100 text-red-700',
};

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function DoctorPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [p, setP] = useState<DoctorPatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // assessment form state
  const [form, setForm] = useState<UpsertAssessmentDto>({});
  const [savingA, setSavingA] = useState(false);
  const [savedA, setSavedA] = useState(false);

  // comment state
  const [comment, setComment] = useState('');
  const [postingC, setPostingC] = useState(false);

  function load() {
    api<DoctorPatientDetail>(`/doctor/patients/${params.id}`)
      .then((d) => {
        setP(d);
        const a = d.assessment;
        setForm({
          diabetesDuration: a?.diabetesDuration ?? '',
          baselineHba1c: a?.baselineHba1c ?? undefined,
          startingDose: a?.startingDose ?? '',
          concomitantMeds: a?.concomitantMeds ?? '',
          treatmentStatus: a?.treatmentStatus ?? 'ONGOING',
          discontinuationReason: a?.discontinuationReason ?? '',
          physicianComments: a?.physicianComments ?? '',
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }

  useEffect(() => {
    if (params.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function saveAssessment(e: FormEvent) {
    e.preventDefault();
    setSavingA(true);
    setSavedA(false);
    try {
      await api<ClinicalAssessment>(`/doctor/patients/${params.id}/assessment`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          baselineHba1c: form.baselineHba1c ? Number(form.baselineHba1c) : undefined,
        }),
      });
      setSavedA(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSavingA(false);
    }
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPostingC(true);
    try {
      const c = await api<PatientComment>(`/doctor/patients/${params.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: comment.trim() }),
      });
      setComment('');
      setP((prev) => (prev ? { ...prev, comments: [c, ...prev.comments] } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not comment');
    } finally {
      setPostingC(false);
    }
  }

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!p) return <p className="text-slate-400">Loading…</p>;

  const ended = form.treatmentStatus && form.treatmentStatus !== 'ONGOING';

  return (
    <>
      <Link href="/doctor/patients" className="text-sm text-petra-600 hover:underline">
        ← My patients
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-800">{p.fullName}</h1>
      <p className="mb-6 text-slate-500">
        {p.email} · {p.phone ?? 'no phone'} ·{' '}
        {p.chronicConditions.length ? p.chronicConditions.join(', ') : 'no chronic conditions'}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Age" value={p.age ?? '—'} />
        <StatTile label="Sex" value={p.gender ?? '—'} />
        <StatTile label="Weight" value={p.latestWeightKg != null ? `${p.latestWeightKg} kg` : '—'} />
        <StatTile label="BMI" value={p.bmi ?? '—'} hint={p.bmiCategory ?? undefined} />
      </div>

      <div className="mb-6">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Weight trend</h2>
          <WeightChart data={p.weightEntries} />
        </Card>
      </div>

      {/* Clinical assessment form */}
      <form onSubmit={saveAssessment} className="mb-6">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-700">Clinical assessment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Diabetes duration">
              <input
                className={inputCls}
                value={form.diabetesDuration ?? ''}
                onChange={(e) => setForm({ ...form, diabetesDuration: e.target.value })}
                placeholder="e.g. 5 years"
              />
            </Labeled>
            <Labeled label="Baseline HbA1c (%)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.baselineHba1c ?? ''}
                onChange={(e) =>
                  setForm({ ...form, baselineHba1c: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="8.2"
              />
            </Labeled>
            <Labeled label="Starting dose">
              <input
                className={inputCls}
                value={form.startingDose ?? ''}
                onChange={(e) => setForm({ ...form, startingDose: e.target.value })}
                placeholder="0.25 mg"
              />
            </Labeled>
            <Labeled label="Treatment status">
              <select
                className={inputCls}
                value={form.treatmentStatus}
                onChange={(e) =>
                  setForm({ ...form, treatmentStatus: e.target.value as TreatmentStatus })
                }
              >
                <option value="ONGOING">Continued (ongoing)</option>
                <option value="COMPLETED">Completed</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </Labeled>
            <div className="sm:col-span-2">
              <Labeled label="Concomitant medications">
                <input
                  className={inputCls}
                  value={form.concomitantMeds ?? ''}
                  onChange={(e) => setForm({ ...form, concomitantMeds: e.target.value })}
                  placeholder="e.g. Metformin 1000mg"
                />
              </Labeled>
            </div>
            {ended && (
              <div className="sm:col-span-2">
                <Labeled label="Reason for discontinuation">
                  <input
                    className={inputCls}
                    value={form.discontinuationReason ?? ''}
                    onChange={(e) => setForm({ ...form, discontinuationReason: e.target.value })}
                    placeholder="Reason treatment ended"
                  />
                </Labeled>
              </div>
            )}
            <div className="sm:col-span-2">
              <Labeled label="Physician comments">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.physicianComments ?? ''}
                  onChange={(e) => setForm({ ...form, physicianComments: e.target.value })}
                />
              </Labeled>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={savingA}
              className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60"
            >
              {savingA ? 'Saving…' : 'Save assessment'}
            </button>
            {savedA && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </Card>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Adverse events */}
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Adverse events ({p.adverseEvents.length})</h2>
          {p.adverseEvents.length === 0 ? (
            <p className="text-sm text-slate-400">None reported.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.adverseEvents.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0">
                  <div>
                    <span
                      className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[e.severity]}`}
                    >
                      {e.severity.toLowerCase()}
                    </span>
                    <span className="text-slate-700">{e.description}</span>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(e.onsetDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Comments */}
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Comments to patient</h2>
          <form onSubmit={addComment} className="mb-3 flex gap-2">
            <input
              className={inputCls}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment the patient will see…"
            />
            <button
              type="submit"
              disabled={postingC}
              className="shrink-0 rounded-lg bg-petra-500 px-3 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60"
            >
              Post
            </button>
          </form>
          {p.comments.length === 0 ? (
            <p className="text-sm text-slate-400">No comments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.comments.map((c) => (
                <li key={c.id} className="border-b pb-2 last:border-0">
                  <p className="text-slate-700">{c.body}</p>
                  <p className="text-xs text-slate-400">
                    {c.doctorName ?? 'Doctor'} · {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
