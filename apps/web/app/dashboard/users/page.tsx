'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Doctor, ManagerUser } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function UsersPage() {
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', officeName: '' });
  const [newDoctorIds, setNewDoctorIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function load() {
    api<ManagerUser[]>('/admin/users').then(setManagers).catch((e) => setError(e.message));
    api<Doctor[]>('/directory/doctors').then(setDoctors).catch(() => {});
  }
  useEffect(load, []);

  const doctorName = (id: string) => doctors.find((d) => d.id === id)?.fullName ?? id;

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<ManagerUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...form, doctorIds: newDoctorIds }),
      });
      setForm({ username: '', email: '', password: '', fullName: '', officeName: '' });
      setNewDoctorIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  async function saveDoctors(m: ManagerUser, doctorIds: string[]) {
    await api(`/admin/users/${m.id}`, { method: 'PATCH', body: JSON.stringify({ doctorIds }) });
    load();
  }

  async function remove(m: ManagerUser) {
    if (!confirm(`Delete manager "${m.fullName}"?`)) return;
    await api(`/admin/users/${m.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <PageHeader title="Manager users" />
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Create a manager</h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Username" className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input required type="email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Full name" className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input placeholder="Office name" className={inputCls} value={form.officeName} onChange={(e) => setForm({ ...form, officeName: e.target.value })} />
            <input required type="password" placeholder="Password (min 8)" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-600">Doctors managed</p>
              <DoctorPicker doctors={doctors} selected={newDoctorIds} onChange={setNewDoctorIds} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60">
                {busy ? 'Creating…' : 'Create manager'}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        {managers.map((m) => (
          <Card key={m.id}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{m.fullName}</p>
                <p className="text-sm text-slate-500">
                  @{m.username} · {m.email} {m.officeName ? `· ${m.officeName}` : ''}
                </p>
              </div>
              <button onClick={() => remove(m)} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">
              Doctors managed ({m.doctorCount})
            </p>
            <DoctorPicker
              doctors={doctors}
              selected={m.doctorIds}
              onChange={(ids) => saveDoctors(m, ids)}
            />
            {m.doctorIds.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">{m.doctorIds.map(doctorName).join(', ')}</p>
            )}
          </Card>
        ))}
        {managers.length === 0 && <p className="text-sm text-slate-400">No managers yet.</p>}
      </div>
    </>
  );
}

function DoctorPicker({
  doctors,
  selected,
  onChange,
}: {
  doctors: Doctor[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {doctors.map((d) => {
        const on = selected.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              on ? 'border-petra-500 bg-petra-50 text-petra-700' : 'border-slate-300 text-slate-500'
            }`}
          >
            {on ? '✓ ' : ''}
            {d.fullName}
          </button>
        );
      })}
      {doctors.length === 0 && <span className="text-xs text-slate-400">No doctors yet.</span>}
    </div>
  );
}
