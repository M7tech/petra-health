'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { City, Country, UpsertCityDto } from '@petra/shared';
import { api } from '@/lib/api';
import { Button, Card, Input, PageHeader, Select } from '@/components/ui';

const EMPTY: UpsertCityDto = { name: '', countryId: '' };

export default function CitiesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState<UpsertCityDto>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [cs, ct] = await Promise.all([
      api<Country[]>('/directory/countries'),
      api<City[]>('/directory/cities'),
    ]);
    setCountries(cs);
    setCities(ct);
  }
  useEffect(() => {
    load();
  }, []);

  const countryName = (id: string) => countries.find((c) => c.id === id)?.name ?? '—';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = JSON.stringify(form);
      if (editingId) await api(`/directory/cities/${editingId}`, { method: 'PUT', body });
      else await api('/directory/cities', { method: 'POST', body });
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this city and its doctors?')) return;
    await api(`/directory/cities/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Cities" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">City</th>
                  <th className="pb-2">Country</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">{c.name}</td>
                    <td className="py-2 text-slate-500">{countryName(c.countryId)}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(c.id);
                            setForm({ name: c.name, countryId: c.countryId });
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => remove(c.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No cities yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-700">
            {editingId ? 'Edit city' : 'Add city'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-sm text-slate-600">Country</label>
              <Select
                required
                value={form.countryId}
                onChange={(e) => setForm({ ...form, countryId: e.target.value })}
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
              <label className="mb-1 block text-sm text-slate-600">City name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
