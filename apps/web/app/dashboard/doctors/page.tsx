'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { City, Country, Doctor, UpsertDoctorDto } from '@petra/shared';
import { api } from '@/lib/api';
import { Button, Card, Input, PageHeader, Select } from '@/components/ui';

const EMPTY: UpsertDoctorDto = {
  fullName: '',
  specialty: '',
  phone: '',
  cityId: '',
  countryId: '',
};

export default function DoctorsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<UpsertDoctorDto>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [ct, ci, dc] = await Promise.all([
      api<Country[]>('/directory/countries'),
      api<City[]>('/directory/cities'),
      api<Doctor[]>('/directory/doctors'),
    ]);
    setCountries(ct);
    setCities(ci);
    setDoctors(dc);
  }
  useEffect(() => {
    load();
  }, []);

  // Cascading: only cities in the chosen country are selectable.
  const citiesInCountry = useMemo(
    () => cities.filter((c) => c.countryId === form.countryId),
    [cities, form.countryId],
  );

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? '—';
  const countryName = (id: string) => countries.find((c) => c.id === id)?.name ?? '—';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = JSON.stringify(form);
      if (editingId) await api(`/directory/doctors/${editingId}`, { method: 'PUT', body });
      else await api('/directory/doctors', { method: 'POST', body });
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this doctor?')) return;
    await api(`/directory/doctors/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Doctors" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Specialty</th>
                  <th className="pb-2">City</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">{d.fullName}</td>
                    <td className="py-2 text-slate-500">{d.specialty ?? '—'}</td>
                    <td className="py-2 text-slate-500">
                      {cityName(d.cityId)}, {countryName(d.countryId)}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(d.id);
                            setForm({
                              fullName: d.fullName,
                              specialty: d.specialty ?? '',
                              phone: d.phone ?? '',
                              cityId: d.cityId,
                              countryId: d.countryId,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => remove(d.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No doctors yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-700">
            {editingId ? 'Edit doctor' : 'Add doctor'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-sm text-slate-600">Country</label>
              <Select
                required
                value={form.countryId}
                onChange={(e) =>
                  // Reset city when country changes to keep the FK consistent.
                  setForm({ ...form, countryId: e.target.value, cityId: '' })
                }
              >
                <option value="">Select country…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">City</label>
              <Select
                required
                disabled={!form.countryId}
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              >
                <option value="">
                  {form.countryId ? 'Select city…' : 'Choose a country first'}
                </option>
                {citiesInCountry.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Full name</label>
              <Input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Specialty</label>
              <Input
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Phone</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Save' : 'Add'}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
