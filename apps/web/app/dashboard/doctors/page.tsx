'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { City, Country, Doctor, UpsertDoctorDto } from '@petra/shared';
import { api } from '@/lib/api';
import { Button, Card, Input, PageHeader, Select, Field } from '@/components/ui';

const EMPTY: UpsertDoctorDto = {
  fullName: '',
  specialty: '',
  phone: '',
  cityId: '',
  countryId: '',
  email: '',
  password: '',
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
      // Only send login fields when filled (empty email fails validation).
      const payload: UpsertDoctorDto = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.password) delete payload.password;
      const body = JSON.stringify(payload);
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
            <div className="table-wrap"><table>
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
                              email: d.email ?? '',
                              password: '',
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
            </table></div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-700">
            {editingId ? 'Edit doctor' : 'Add doctor'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <Field label="Country"><Select
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
              </Select></Field>
            <Field label="City"><Select
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
              </Select></Field>
            <Field label="Full name"><Input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              /></Field>
            <Field label="Specialty"><Input
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              /></Field>
            <Field label="Phone"><Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              /></Field>
            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Portal login (optional)
              </p>
              <label className="mb-1 block text-sm text-slate-600">Login email</label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <label className="mb-1 mt-2 block text-sm text-slate-600">
                {editingId ? 'New password (leave blank to keep)' : 'Password'}
              </label>
              <Input
                type="password"
                value={form.password ?? ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
