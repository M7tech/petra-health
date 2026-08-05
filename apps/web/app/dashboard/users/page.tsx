'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { City, Country, ManagerUser } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

export default function UsersPage() {
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    officeName: '',
    whatsappPhone: '',
  });
  const [newCityIds, setNewCityIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function load() {
    api<ManagerUser[]>('/admin/users').then(setManagers).catch((e) => setError(e.message));
    api<City[]>('/directory/cities').then(setCities).catch(() => {});
    api<Country[]>('/directory/countries').then(setCountries).catch(() => {});
  }
  useEffect(load, []);

  const countryName = (id: string) => countries.find((c) => c.id === id)?.name ?? '';

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<ManagerUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          whatsappPhone: form.whatsappPhone.trim() || undefined,
          cityIds: newCityIds,
        }),
      });
      setForm({ username: '', email: '', password: '', fullName: '', officeName: '', whatsappPhone: '' });
      setNewCityIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  async function saveCities(m: ManagerUser, cityIds: string[]) {
    await api(`/admin/users/${m.id}`, { method: 'PATCH', body: JSON.stringify({ cityIds }) });
    load();
  }

  async function saveWhatsapp(m: ManagerUser, whatsappPhone: string) {
    await api(`/admin/users/${m.id}`, { method: 'PATCH', body: JSON.stringify({ whatsappPhone }) });
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
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Assign a manager one or more cities — every doctor and patient in those cities becomes
        visible to them automatically.
      </p>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Create a manager</h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Username" className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input required type="email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Full name" className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input placeholder="Office name" className={inputCls} value={form.officeName} onChange={(e) => setForm({ ...form, officeName: e.target.value })} />
            <input placeholder="WhatsApp number, e.g. +9647500000000" className={inputCls} value={form.whatsappPhone} onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} />
            <input required type="password" placeholder="Password (min 8)" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium text-slate-600">Cities assigned</p>
              <CityPicker cities={cities} countryName={countryName} selected={newCityIds} onChange={setNewCityIds} />
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
            <div className="mb-2 flex gap-4 text-sm text-slate-600">
              <span>
                <b className="tabular-nums">{m.doctorCount}</b> doctors
              </span>
              <span>
                <b className="tabular-nums">{m.patientCount}</b> patients
              </span>
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">Cities assigned</p>
            <CityPicker
              cities={cities}
              countryName={countryName}
              selected={m.cities.map((c) => c.id)}
              onChange={(ids) => saveCities(m, ids)}
            />
            <p className="mb-1 mt-3 text-sm font-medium text-slate-600">WhatsApp number</p>
            <WhatsappEditor value={m.whatsappPhone} onSave={(v) => saveWhatsapp(m, v)} />
          </Card>
        ))}
        {managers.length === 0 && <p className="text-sm text-slate-400">No managers yet.</p>}
      </div>
    </>
  );
}

function CityPicker({
  cities,
  countryName,
  selected,
  onChange,
}: {
  cities: City[];
  countryName: (id: string) => string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {cities.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              on ? 'border-petra-500 bg-petra-50 text-petra-700' : 'border-slate-300 text-slate-500'
            }`}
          >
            {on ? '✓ ' : ''}
            {c.name}, {countryName(c.countryId)}
          </button>
        );
      })}
      {cities.length === 0 && <span className="text-xs text-slate-400">No cities yet.</span>}
    </div>
  );
}

function WhatsappEditor({ value, onSave }: { value: string | null; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value ?? '');
  const [busy, setBusy] = useState(false);
  const changed = draft !== (value ?? '');

  async function save() {
    setBusy(true);
    try {
      await onSave(draft);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="+9647500000000"
        className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20"
      />
      {changed && (
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      )}
    </div>
  );
}
