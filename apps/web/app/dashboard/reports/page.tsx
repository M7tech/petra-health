'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminReports, DoctorReportPatient, DoctorReportRow, TreatmentStatus } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader, StatTile, Button } from '@/components/ui';

const STATUS_STYLES: Record<string, string> = {
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-200 text-slate-600',
  DISCONTINUED: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: TreatmentStatus | null }) {
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Not assessed';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status ? STATUS_STYLES[status] : 'bg-amber-100 text-amber-700'
      }`}
    >
      {label}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Builds a CSV file client-side and triggers a browser download — no backend
// export endpoint needed since the data's already been fetched for the page.
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [data, setData] = useState<AdminReports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminReports>('/admin/reports')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  const { summary } = data;

  // Doctor -> patient roster flattened to one row per patient, the most
  // useful shape for both reading and exporting.
  const roster: { doctor: DoctorReportRow; patient: DoctorReportPatient | null }[] = data.doctors.flatMap((d) =>
    d.patients.length
      ? d.patients.map((p) => ({ doctor: d, patient: p as DoctorReportPatient | null }))
      : [{ doctor: d, patient: null as DoctorReportPatient | null }],
  );

  return (
    <>
      <PageHeader
        title="Reports"
        action={
          <p className="text-sm text-slate-400">Generated {new Date(data.generatedAt).toLocaleString()}</p>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total patients" value={summary.totalPatients} />
        <StatTile
          label="Ongoing treatment"
          value={summary.treatmentStatus.ongoing}
          hint={`${summary.treatmentStatus.completed} completed · ${summary.treatmentStatus.discontinued} discontinued`}
        />
        <StatTile label="Doctors" value={summary.totalDoctors} />
        <StatTile
          label="Pharmacies"
          value={summary.totalPharmacies}
          hint={`${summary.activePharmacies} active`}
        />
      </div>

      {/* --- Patient status report --- */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Patient status report ({data.patients.length})</h2>
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                'patient-status-report.csv',
                ['Name', 'Email', 'Country', 'City', 'Doctor', 'Status', 'Medications', 'Doses', 'Last dose', 'Registered'],
                data.patients.map((p) => [
                  p.fullName,
                  p.email,
                  p.countryName ?? '',
                  p.cityName ?? '',
                  p.doctorName ?? '',
                  p.treatmentStatus ?? 'NOT_ASSESSED',
                  p.medicationCount,
                  p.doseCount,
                  fmtDate(p.lastDoseAt),
                  fmtDate(p.createdAt),
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Doctor</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Meds</th>
                  <th className="pb-2 text-right">Doses</th>
                  <th className="pb-2">Last dose</th>
                  <th className="pb-2">Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 font-medium text-petra-700">
                      <Link href={`/dashboard/patients/${p.id}`} className="hover:underline">
                        {p.fullName}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-500">
                      {[p.cityName, p.countryName].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-2 text-slate-500">{p.doctorName ?? '—'}</td>
                    <td className="py-2">
                      <StatusBadge status={p.treatmentStatus} />
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{p.medicationCount}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{p.doseCount}</td>
                    <td className="py-2 text-slate-500">{fmtDate(p.lastDoseAt)}</td>
                    <td className="py-2 text-slate-500">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
                {data.patients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No patients yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* --- Doctors & their patients --- */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Doctors &amp; their patients ({data.doctors.length})</h2>
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                'doctors-and-patients-report.csv',
                ['Doctor', 'Specialty', 'City', 'Country', 'Patient count', 'Patient name', 'Patient status', 'Patient registered'],
                roster.map(({ doctor, patient }) => [
                  doctor.fullName,
                  doctor.specialty ?? '',
                  doctor.cityName ?? '',
                  doctor.countryName ?? '',
                  doctor.patientCount,
                  patient?.fullName ?? '',
                  patient ? patient.treatmentStatus ?? 'NOT_ASSESSED' : '',
                  patient ? fmtDate(patient.createdAt) : '',
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Doctor</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2 text-right">Patients</th>
                  <th className="pb-2">Patient</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Registered</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(({ doctor, patient }, i) => {
                  const firstOfDoctor = i === 0 || roster[i - 1].doctor.id !== doctor.id;
                  return (
                    <tr key={`${doctor.id}-${patient?.id ?? 'none'}`} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-700">
                        {firstOfDoctor ? (
                          <>
                            {doctor.fullName}
                            {doctor.specialty && <span className="ml-1 text-xs font-normal text-slate-400">({doctor.specialty})</span>}
                          </>
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="py-2 text-slate-500">
                        {firstOfDoctor ? [doctor.cityName, doctor.countryName].filter(Boolean).join(', ') || '—' : ''}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-600">
                        {firstOfDoctor ? doctor.patientCount : ''}
                      </td>
                      <td className="py-2 text-slate-600">
                        {patient ? (
                          <Link href={`/dashboard/patients/${patient.id}`} className="text-petra-700 hover:underline">
                            {patient.fullName}
                          </Link>
                        ) : (
                          <span className="text-slate-400">No patients assigned</span>
                        )}
                      </td>
                      <td className="py-2">{patient && <StatusBadge status={patient.treatmentStatus} />}</td>
                      <td className="py-2 text-slate-500">{patient ? fmtDate(patient.createdAt) : ''}</td>
                    </tr>
                  );
                })}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No doctors yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* --- Pharmacy directory report --- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Pharmacy report ({data.pharmacies.length})</h2>
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                'pharmacy-report.csv',
                ['Name', 'Phone', 'Address', 'Latitude', 'Longitude', 'Status', 'Date added'],
                data.pharmacies.map((p) => [
                  p.name,
                  p.phone ?? '',
                  p.address ?? '',
                  p.latitude,
                  p.longitude,
                  p.active ? 'Active' : 'Disabled',
                  fmtDate(p.createdAt),
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Address</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2">Date added</th>
                </tr>
              </thead>
              <tbody>
                {data.pharmacies.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 font-medium text-slate-700">{p.name}</td>
                    <td className="py-2 text-slate-500">{p.address ?? '—'}</td>
                    <td className="py-2 text-slate-500">{p.phone ?? '—'}</td>
                    <td className="py-2 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {p.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
                {data.pharmacies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No pharmacies added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
