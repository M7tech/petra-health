'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PatientLocation, Pharmacy } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, EmptyState, ErrorBanner, PageHeader, TableSkeleton } from '@/components/ui';

// Leaflet touches `window` at module load — must never render during SSR.
const PatientMap = dynamic(() => import('@/components/PatientMap'), {
  ssr: false,
  loading: () => <TableSkeleton rows={4} />,
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
      <PageHeader
        title="Map"
        subtitle="Blue pins are patient locations, captured from their device on first login. Pharmacy pins come from your pharmacy directory."
      />
      {error && <ErrorBanner message={error} />}
      <Card>
        {locations == null ? (
          <TableSkeleton rows={4} />
        ) : locations.length === 0 && pharmacies.length === 0 ? (
          <EmptyState title="Nothing on the map yet" hint="Patient locations appear after their first login; add pharmacies under Pharmacies." />
        ) : (
          <PatientMap locations={locations} pharmacies={pharmacies} />
        )}
      </Card>
    </>
  );
}
