'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Country, UpsertCountryDto } from '@petra/shared';
import { api } from '@/lib/api';
import { Button, Card, Input, PageHeader } from '@/components/ui';

const EMPTY: UpsertCountryDto = { name: '', isoCode: '' };

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState<UpsertCountryDto>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setCountries(await api<Country[]>('/directory/countries'));
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = JSON.stringify({ ...form, isoCode: form.isoCode.toUpperCase() });
      if (editingId) {
        await api(`/directory/countries/${editingId}`, { method: 'PUT', body });
      } else {
        await api('/directory/countries', { method: 'POST', body });
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this country and all its cities/doctors?')) return;
    await api(`/directory/countries/${id}`, { method: 'DELETE' });
    await load();
  }

  function edit(c: Country) {
    setEditingId(c.id);
    setForm({ name: c.name, isoCode: c.isoCode });
  }

  return (
    <>
      <PageHeader title="Countries" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            {loading ? (
              <p className="text-slate-400">Loading…</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">ISO</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-medium text-slate-700">{c.name}</td>
                      <td className="py-2 text-slate-500">{c.isoCode}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => edit(c)}>
                            Edit
                          </Button>
                          <Button variant="danger" onClick={() => remove(c.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {countries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No countries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-700">
            {editingId ? 'Edit country' : 'Add country'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-sm text-slate-600">Name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">ISO code (2 letters)</label>
              <Input
                required
                maxLength={2}
                value={form.isoCode}
                onChange={(e) => setForm({ ...form, isoCode: e.target.value.toUpperCase() })}
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
