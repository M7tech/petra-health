'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PatientLocation, Pharmacy } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

// Leaflet touches `window` at module load — must never render during SSR.
const PatientMap = dynamic(() => import('@/components/PatientMap'), {
  ssr: false,
  loading: () => <p className="text-slate-400">Loading map…</p>,
});

export default function MapPage() {
  const [locations, setLocations] = useState<PatientLocation[] | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PatientLocation[]>('/admin/patients-map')
      .then(setLocations)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
    api<Pharmacy[]>('/pharmacies').then(setPharmacies).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Map" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Blue pins are patient locations, captured from their device on first login. 💊 pins are
        your pharmacy directory (manage them from Pharmacies).
      </p>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <Card>
        {locations == null ? (
          <p className="text-slate-400">Loading…</p>
        ) : locations.length === 0 && pharmacies.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing to show on the map yet.</p>
        ) : (
          <PatientMap locations={locations} pharmacies={pharmacies} />
        )}
      </Card>
    </>
  );
}
