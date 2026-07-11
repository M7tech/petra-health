import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeAssessment } from '../doctor/doctor.service';
import type { AdminStats, PatientDetail, PatientSummary, RegionCount } from '@petra/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminStats> {
    const [
      totalPatients,
      totalDoctors,
      totalCountries,
      totalCities,
      totalMedicationsEnrolled,
      totalDosesLogged,
      totalWeightEntries,
      patientsByCityRaw,
      doctorsByCityRaw,
      recent,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.doctor.count(),
      this.prisma.country.count(),
      this.prisma.city.count(),
      this.prisma.userMedication.count(),
      this.prisma.doseLog.count(),
      this.prisma.weightEntry.count(),
      this.prisma.user.groupBy({
        by: ['cityId'],
        _count: { _all: true },
        where: { cityId: { not: null } },
      }),
      this.prisma.doctor.groupBy({ by: ['cityId'], _count: { _all: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
    ]);

    // Resolve city ids -> "City, Country" labels for the distributions.
    const cityIds = Array.from(
      new Set([
        ...patientsByCityRaw.map((r) => r.cityId).filter((x): x is string => !!x),
        ...doctorsByCityRaw.map((r) => r.cityId),
      ]),
    );
    const cities = await this.prisma.city.findMany({
      where: { id: { in: cityIds } },
      include: { country: true },
    });
    const labelOf = (cityId: string | null): string => {
      const c = cities.find((x) => x.id === cityId);
      return c ? `${c.name}, ${c.country.name}` : 'Unassigned';
    };

    const toRegionCounts = (
      rows: { cityId: string | null; _count: { _all: number } }[],
    ): RegionCount[] =>
      rows
        .map((r) => ({ label: labelOf(r.cityId), count: r._count._all }))
        .sort((a, b) => b.count - a.count);

    return {
      totalPatients,
      totalDoctors,
      totalCountries,
      totalCities,
      totalMedicationsEnrolled,
      totalDosesLogged,
      totalWeightEntries,
      patientsByCity: toRegionCounts(patientsByCityRaw),
      doctorsByCity: toRegionCounts(doctorsByCityRaw),
      recentPatients: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    };
  }

  async listPatients(): Promise<PatientSummary[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        city: { include: { country: true } },
        doctor: true,
        _count: { select: { medications: true, doseLogs: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      countryName: u.city?.country.name ?? null,
      cityName: u.city?.name ?? null,
      doctorName: u.doctor?.fullName ?? null,
      medicationCount: u._count.medications,
      doseCount: u._count.doseLogs,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async getPatient(id: string): Promise<PatientDetail> {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: {
        city: { include: { country: true } },
        doctor: true,
        medications: { include: { _count: { select: { doseLogs: true } } } },
        doseLogs: {
          orderBy: { takenAt: 'desc' },
          take: 20,
          include: { userMedication: true },
        },
        weightEntries: { orderBy: { recordedAt: 'desc' }, take: 50 },
        assessment: true,
        adverseEvents: { orderBy: { onsetDate: 'desc' } },
        comments: { orderBy: { createdAt: 'desc' }, include: { doctor: true } },
        _count: { select: { medications: true, doseLogs: true } },
      },
    });
    if (!u) throw new NotFoundException('Patient not found');

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      countryName: u.city?.country.name ?? null,
      cityName: u.city?.name ?? null,
      doctorName: u.doctor?.fullName ?? null,
      medicationCount: u._count.medications,
      doseCount: u._count.doseLogs,
      createdAt: u.createdAt.toISOString(),
      medications: u.medications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.startDate.toISOString(),
        active: m.active,
        doseCount: m._count.doseLogs,
      })),
      recentDoses: u.doseLogs.map((d) => ({
        id: d.id,
        medicationName: d.userMedication.name,
        scheduledFor: d.scheduledFor.toISOString(),
        takenAt: d.takenAt.toISOString(),
        doseMg: d.doseMg,
      })),
      weightEntries: u.weightEntries.map((w) => ({
        id: w.id,
        weightKg: w.weightKg,
        recordedAt: w.recordedAt.toISOString(),
        note: w.note,
      })),
      assessment: u.assessment ? serializeAssessment(u.assessment) : null,
      adverseEvents: u.adverseEvents.map((e) => ({
        id: e.id,
        description: e.description,
        severity: e.severity,
        onsetDate: e.onsetDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      comments: u.comments.map((c) => ({
        id: c.id,
        body: c.body,
        doctorId: c.doctorId,
        doctorName: c.doctor?.fullName ?? null,
        weightEntryId: c.weightEntryId,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }
}
