import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeAssessment } from '../doctor/doctor.service';
import { PushService } from '../push/push.service';
import { Principal } from '../auth/jwt.types';
import type {
  AdminStats,
  ManagerScope,
  MessageThreadSummary,
  PatientDetail,
  PatientSummary,
  RegionCount,
  SupportMessage,
} from '@petra/shared';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  // Returns the city ids a manager is scoped to, or null for a super-admin
  // (meaning "no restriction" — sees everything).
  private async scopeCityIds(principal: Principal): Promise<string[] | null> {
    if (principal.role === 'SUPERADMIN') return null;
    const admin = await this.prisma.admin.findUnique({
      where: { id: principal.id },
      include: { managedCities: { select: { id: true } } },
    });
    return admin?.managedCities.map((c) => c.id) ?? [];
  }

  // What the logged-in admin/manager is scoped to (their region summary).
  async myScope(principal: Principal): Promise<ManagerScope> {
    if (principal.role === 'SUPERADMIN') {
      return { isSuperAdmin: true, officeName: null, cities: [], doctors: [], patientCount: 0 };
    }
    const admin = await this.prisma.admin.findUnique({
      where: { id: principal.id },
      include: { managedCities: { include: { country: true } } },
    });
    if (!admin) throw new NotFoundException('Admin not found');

    const cityIds = admin.managedCities.map((c) => c.id);
    const [doctors, patientCount] = cityIds.length
      ? await Promise.all([
          this.prisma.doctor.findMany({
            where: { cityId: { in: cityIds } },
            orderBy: { fullName: 'asc' },
            select: {
              id: true,
              fullName: true,
              specialty: true,
              phone: true,
              cityId: true,
              countryId: true,
              email: true,
              managerId: true,
            },
          }),
          this.prisma.user.count({ where: { cityId: { in: cityIds } } }),
        ])
      : [[], 0];

    return {
      isSuperAdmin: false,
      officeName: admin.officeName,
      cities: admin.managedCities.map((c) => ({
        id: c.id,
        name: c.name,
        countryId: c.countryId,
        countryName: c.country.name,
      })),
      doctors,
      patientCount,
    };
  }

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
      patientsForMetrics,
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
      this.prisma.user.findMany({
        select: {
          gender: true,
          _count: { select: { medications: true } },
          doseLogs: { orderBy: { takenAt: 'desc' }, take: 1, select: { takenAt: true } },
          weightEntries: { orderBy: { recordedAt: 'asc' }, select: { weightKg: true } },
        },
      }),
    ]);

    // --- CRF metrics: gender split, injection adherence, total weight lost ---
    const genderBreakdown = { male: 0, female: 0, unspecified: 0 };
    const adherence = { onTime: 0, overdue: 0, notStarted: 0 };
    let totalKgLost = 0;
    const WEEK_MS = 8 * 24 * 60 * 60 * 1000; // weekly injection + 1 day grace
    const now = Date.now();
    for (const u of patientsForMetrics) {
      if (u.gender === 'MALE') genderBreakdown.male++;
      else if (u.gender === 'FEMALE') genderBreakdown.female++;
      else genderBreakdown.unspecified++;

      if (u._count.medications === 0) {
        adherence.notStarted++;
      } else {
        const last = u.doseLogs[0]?.takenAt;
        if (last && now - last.getTime() <= WEEK_MS) adherence.onTime++;
        else adherence.overdue++;
      }

      if (u.weightEntries.length >= 2) {
        const first = u.weightEntries[0].weightKg;
        const latest = u.weightEntries[u.weightEntries.length - 1].weightKg;
        if (first > latest) totalKgLost += first - latest;
      }
    }
    totalKgLost = Math.round(totalKgLost * 10) / 10;

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
      genderBreakdown,
      adherence,
      totalKgLost,
      patientsByCity: toRegionCounts(patientsByCityRaw),
      doctorsByCity: toRegionCounts(doctorsByCityRaw),
      recentPatients: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    };
  }

  async listPatients(principal: Principal): Promise<PatientSummary[]> {
    const cityIds = await this.scopeCityIds(principal);
    const users = await this.prisma.user.findMany({
      where: cityIds ? { cityId: { in: cityIds } } : undefined,
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

  async getPatient(id: string, principal: Principal): Promise<PatientDetail> {
    const cityIds = await this.scopeCityIds(principal);
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
        hba1cEntries: { orderBy: { recordedAt: 'asc' } },
        assessment: true,
        adverseEvents: { orderBy: { onsetDate: 'desc' } },
        comments: { orderBy: { createdAt: 'desc' }, include: { doctor: true } },
        _count: { select: { medications: true, doseLogs: true } },
      },
    });
    if (!u) throw new NotFoundException('Patient not found');
    // A manager can only see patients within their assigned cities — return
    // NotFound (not Forbidden) to avoid revealing the patient exists elsewhere.
    if (cityIds && (!u.cityId || !cityIds.includes(u.cityId))) {
      throw new NotFoundException('Patient not found');
    }

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
      hba1cEntries: u.hba1cEntries.map((h) => ({
        id: h.id,
        value: h.value,
        recordedAt: h.recordedAt.toISOString(),
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

  // ---- Support inbox (patient <-> admin) ----
  async messageThreads(): Promise<MessageThreadSummary[]> {
    const users = await this.prisma.user.findMany({
      where: { messages: { some: {} } },
      include: { messages: { orderBy: { createdAt: 'desc' } } },
    });
    return users
      .map((u) => {
        const last = u.messages[0];
        // Patient messages newer than the most recent admin reply = "needs reply".
        const lastAdminAt = u.messages.find((m) => m.sender === 'ADMIN')?.createdAt;
        const unreadFromPatient = u.messages.filter(
          (m) => m.sender === 'PATIENT' && (!lastAdminAt || m.createdAt > lastAdminAt),
        ).length;
        return {
          userId: u.id,
          patientName: u.fullName,
          patientEmail: u.email,
          lastMessage: last.body,
          lastAt: last.createdAt.toISOString(),
          unreadFromPatient,
        };
      })
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  }

  async thread(userId: string): Promise<SupportMessage[]> {
    const rows = await this.prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((m) => ({
      id: m.id,
      sender: m.sender as SupportMessage['sender'],
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async reply(userId: string, body: string): Promise<SupportMessage> {
    const patient = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!patient) throw new NotFoundException('Patient not found');
    const m = await this.prisma.supportMessage.create({
      data: { userId, sender: 'ADMIN', body },
    });
    // Fire-and-forget: a failed/unregistered push shouldn't fail the reply itself.
    void this.push.send(patient.pushToken, 'Petra Health', body);
    return { id: m.id, sender: 'ADMIN', body: m.body, createdAt: m.createdAt.toISOString() };
  }
}
