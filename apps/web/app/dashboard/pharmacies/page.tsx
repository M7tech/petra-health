'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Pharmacy } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

const emptyForm = { name: '', phone: '', address: '', latitude: '', longitude: '' };

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  function load() {
    api<Pharmacy[]>('/pharmacies').then(setPharmacies).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Latitude/longitude must be numbers');
      }
      await api<Pharmacy>('/pharmacies', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          latitude: lat,
          longitude: lng,
        }),
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(p: Pharmacy) {
    await api(`/pharmacies/${p.id}`, { method: 'PUT', body: JSON.stringify({ active: !p.active }) });
    load();
  }

  async function remove(p: Pharmacy) {
    await api(`/pharmacies/${p.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <PageHeader title="Pharmacies" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Shown to patients in the app&apos;s &quot;Near me&quot; pharmacy finder and as pins on the
        map. Disabled pharmacies stay here but are hidden from patients.
      </p>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Add a pharmacy</h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Address" className={`sm:col-span-2 ${inputCls}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input required placeholder="Latitude, e.g. 36.1911" className={inputCls} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            <input required placeholder="Longitude, e.g. 44.0092" className={inputCls} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60">
                {busy ? 'Adding…' : 'Add pharmacy'}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        {pharmacies.length === 0 ? (
          <p className="text-sm text-slate-400">No pharmacies added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Address</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2 text-center">Active</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pharmacies.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium text-slate-700">{p.name}</td>
                  <td className="py-2.5 text-slate-500">{p.address ?? '—'}</td>
                  <td className="py-2.5 text-slate-500">{p.phone ?? '—'}</td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        p.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => remove(p)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
