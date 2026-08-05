'use client';

import { Fragment, FormEvent, useEffect, useState } from 'react';
import type { Pharmacy } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';

const emptyForm = { name: '', phone: '', address: '', mapLink: '', latitude: '', longitude: '' };

type PharmacyForm = typeof emptyForm;

function formFromPharmacy(p: Pharmacy): PharmacyForm {
  return {
    name: p.name,
    phone: p.phone ?? '',
    address: p.address ?? '',
    mapLink: '',
    latitude: String(p.latitude),
    longitude: String(p.longitude),
  };
}

// Shared location + name/phone/address fields for both the "Add" form and
// each row's "Edit" form.
function LocationFields({
  form,
  setForm,
  manualEntry,
  setManualEntry,
}: {
  form: PharmacyForm;
  setForm: (f: PharmacyForm) => void;
  manualEntry: boolean;
  setManualEntry: (v: boolean) => void;
}) {
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const hasCoords = form.latitude !== '' && form.longitude !== '';

  async function detectLocation() {
    if (!form.mapLink.trim()) return;
    setDetecting(true);
    setDetectError(null);
    try {
      const { latitude, longitude } = await api<{ latitude: number; longitude: number }>(
        '/pharmacies/resolve-location',
        { method: 'POST', body: JSON.stringify({ url: form.mapLink.trim() }) },
      );
      setForm({ ...form, latitude: String(latitude), longitude: String(longitude) });
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Could not detect location');
    } finally {
      setDetecting(false);
    }
  }

  return (
    <>
      <input required placeholder="Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Address" className={`sm:col-span-2 ${inputCls}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

      <div className="sm:col-span-2">
        <p className="mb-1 text-sm font-medium text-slate-600">Location</p>
        {!manualEntry ? (
          <>
            <div className="flex gap-2">
              <input
                placeholder="Paste a Google Maps share link (Share → Copy link)"
                className={inputCls}
                value={form.mapLink}
                onChange={(e) => {
                  setForm({ ...form, mapLink: e.target.value });
                  setDetectError(null);
                }}
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={detecting || !form.mapLink.trim()}
                className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                {detecting ? 'Detecting…' : 'Detect location'}
              </button>
            </div>
            {hasCoords && !detectError && (
              <p className="mt-1 text-xs text-green-600">
                📍 {form.mapLink.trim() ? 'Detected' : 'Current'}: {form.latitude}, {form.longitude}
              </p>
            )}
            {detectError && <p className="mt-1 text-xs text-red-600">{detectError}</p>}
            <button type="button" onClick={() => setManualEntry(true)} className="mt-1 text-xs text-slate-400 hover:underline">
              Or enter coordinates manually
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Latitude, e.g. 36.1911"
                className={inputCls}
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
              <input
                placeholder="Longitude, e.g. 44.0092"
                className={inputCls}
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <button type="button" onClick={() => setManualEntry(false)} className="mt-1 text-xs text-slate-400 hover:underline">
              Use a Google Maps link instead
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editManual, setEditManual] = useState(true); // editing starts from known coords
  const [editBusy, setEditBusy] = useState(false);

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
        throw new Error(
          manualEntry ? 'Latitude/longitude must be numbers' : 'Paste a Google Maps link and detect the location first',
        );
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
      setManualEntry(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(p: Pharmacy) {
    setEditingId(p.id);
    setEditForm(formFromPharmacy(p));
    setEditManual(true);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(e: FormEvent, id: string) {
    e.preventDefault();
    setEditBusy(true);
    setError(null);
    try {
      const lat = parseFloat(editForm.latitude);
      const lng = parseFloat(editForm.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Latitude/longitude must be numbers');
      }
      await api<Pharmacy>(`/pharmacies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone.trim() || undefined,
          address: editForm.address.trim() || undefined,
          latitude: lat,
          longitude: lng,
        }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setEditBusy(false);
    }
  }

  async function toggleActive(p: Pharmacy) {
    await api(`/pharmacies/${p.id}`, { method: 'PUT', body: JSON.stringify({ active: !p.active }) });
    load();
  }

  async function remove(p: Pharmacy) {
    if (!confirm(`Delete pharmacy "${p.name}"?`)) return;
    await api(`/pharmacies/${p.id}`, { method: 'DELETE' });
    load();
  }

  const hasCoords = form.latitude !== '' && form.longitude !== '';

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
            <LocationFields form={form} setForm={setForm} manualEntry={manualEntry} setManualEntry={setManualEntry} />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy || !hasCoords}
                className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60"
              >
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
                <Fragment key={p.id}>
                  <tr className="border-b last:border-0">
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
                      <button
                        onClick={() => (editingId === p.id ? cancelEdit() : startEdit(p))}
                        className="mr-3 text-xs text-petra-700 hover:underline"
                      >
                        {editingId === p.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button onClick={() => remove(p)} className="text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editingId === p.id && (
                    <tr className="border-b bg-slate-50 last:border-0">
                      <td colSpan={5} className="p-4">
                        <form onSubmit={(e) => saveEdit(e, p.id)} className="grid gap-3 sm:grid-cols-2">
                          <LocationFields form={editForm} setForm={setEditForm} manualEntry={editManual} setManualEntry={setEditManual} />
                          <div className="flex gap-2 sm:col-span-2">
                            <button
                              type="submit"
                              disabled={editBusy}
                              className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60"
                            >
                              {editBusy ? 'Saving…' : 'Save changes'}
                            </button>
                            <button type="button" onClick={cancelEdit} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
