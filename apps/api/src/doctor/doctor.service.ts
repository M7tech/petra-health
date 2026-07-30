import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeAge } from '../common/user-mapper';
import { bmiCategory, computeBmi } from '@petra/shared';
import type {
  ClinicalAssessment,
  DoctorPatientDetail,
  DoctorPatientSummary,
  DoctorStats,
  PatientComment,
} from '@petra/shared';
import { CreateCommentRequest, UpsertAssessmentRequest } from './dto';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async listPatients(doctorId: string): Promise<DoctorPatientSummary[]> {
    const patients = await this.prisma.user.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        weightEntries: { orderBy: { recordedAt: 'desc' }, take: 1 },
        assessment: true,
        _count: { select: { adverseEvents: true } },
      },
    });
    return patients.map((p) => {
      const latestWeightKg = p.weightEntries[0]?.weightKg ?? null;
      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        age: computeAge(p.birthDate),
        gender: p.gender,
        latestWeightKg,
        bmi: computeBmi(latestWeightKg, p.heightCm),
        treatmentStatus: p.assessment?.treatmentStatus ?? null,
        adverseEventCount: p._count.adverseEvents,
        createdAt: p.createdAt.toISOString(),
      };
    });
  }

  async getStats(doctorId: string): Promise<DoctorStats> {
    const [patients, recentPatients] = await Promise.all([
      this.prisma.user.findMany({
        where: { doctorId },
        select: {
          gender: true,
          assessment: { select: { treatmentStatus: true } },
          _count: { select: { medications: true, adverseEvents: true } },
          doseLogs: { orderBy: { takenAt: 'desc' }, take: 1, select: { takenAt: true } },
          weightEntries: { orderBy: { recordedAt: 'asc' }, select: { weightKg: true } },
          hba1cEntries: { orderBy: { recordedAt: 'asc' }, select: { value: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
    ]);

    const genderBreakdown = { male: 0, female: 0, unspecified: 0 };
    const adherence = { onTime: 0, overdue: 0, notStarted: 0 };
    const treatmentStatus = { ongoing: 0, completed: 0, discontinued: 0 };
    let totalKgLost = 0;
    let totalAdverseEvents = 0;
    const hba1cChanges: number[] = [];
    const WEEK_MS = 8 * 24 * 60 * 60 * 1000; // weekly injection + 1 day grace
    const now = Date.now();

    for (const p of patients) {
      if (p.gender === 'MALE') genderBreakdown.male++;
      else if (p.gender === 'FEMALE') genderBreakdown.female++;
      else genderBreakdown.unspecified++;

      if (p._count.medications === 0) {
        adherence.notStarted++;
      } else {
        const last = p.doseLogs[0]?.takenAt;
        if (last && now - last.getTime() <= WEEK_MS) adherence.onTime++;
        else adherence.overdue++;
      }

      const status = p.assessment?.treatmentStatus ?? 'ONGOING';
      if (status === 'ONGOING') treatmentStatus.ongoing++;
      else if (status === 'COMPLETED') treatmentStatus.completed++;
      else treatmentStatus.discontinued++;

      if (p.weightEntries.length >= 2) {
        const first = p.weightEntries[0].weightKg;
        const latest = p.weightEntries[p.weightEntries.length - 1].weightKg;
        if (first > latest) totalKgLost += first - latest;
      }

      if (p.hba1cEntries.length >= 2) {
        const first = p.hba1cEntries[0].value;
        const latest = p.hba1cEntries[p.hba1cEntries.length - 1].value;
        hba1cChanges.push(latest - first);
      }

      totalAdverseEvents += p._count.adverseEvents;
    }

    return {
      totalPatients: patients.length,
      genderBreakdown,
      adherence,
      treatmentStatus,
      totalKgLost: Math.round(totalKgLost * 10) / 10,
      avgHba1cChange:
        hba1cChanges.length === 0
          ? null
          : Math.round((hba1cChanges.reduce((a, b) => a + b, 0) / hba1cChanges.length) * 10) / 10,
      totalAdverseEvents,
      recentPatients: recentPatients.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  // Ensures the patient is assigned to this doctor before returning anything.
  private async assertOwned(doctorId: string, patientId: string) {
    const patient = await this.prisma.user.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) {
      throw new ForbiddenException('This patient is not assigned to you');
    }
    return patient;
  }

  async getPatient(doctorId: string, patientId: string): Promise<DoctorPatientDetail> {
    await this.assertOwned(doctorId, patientId);
    return buildPatientDetail(this.prisma, patientId);
  }

  async upsertAssessment(
    doctorId: string,
    patientId: string,
    dto: UpsertAssessmentRequest,
  ): Promise<ClinicalAssessment> {
    await this.assertOwned(doctorId, patientId);
    const row = await this.prisma.clinicalAssessment.upsert({
      where: { userId: patientId },
      update: { ...dto, doctorId, assessmentDate: new Date() },
      create: { userId: patientId, doctorId, ...dto },
    });
    return serializeAssessment(row);
  }

  async addComment(
    doctorId: string,
    patientId: string,
    dto: CreateCommentRequest,
  ): Promise<PatientComment> {
    await this.assertOwned(doctorId, patientId);
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    const c = await this.prisma.patientComment.create({
      data: {
        userId: patientId,
        doctorId,
        body: dto.body,
        weightEntryId: dto.weightEntryId,
      },
    });
    return {
      id: c.id,
      body: c.body,
      doctorId,
      doctorName: doctor?.fullName ?? null,
      weightEntryId: c.weightEntryId,
      createdAt: c.createdAt.toISOString(),
    };
  }
}

// ---- Shared serializers (also used by the admin + patient views) ----

export function serializeAssessment(a: {
  id: string;
  userId: string;
  doctorId: string | null;
  assessmentDate: Date;
  diabetesDuration: string | null;
  baselineHba1c: number | null;
  startingDose: string | null;
  concomitantMeds: string | null;
  treatmentStatus: string;
  discontinuationReason: string | null;
  physicianComments: string | null;
  updatedAt: Date;
}): ClinicalAssessment {
  return {
    id: a.id,
    userId: a.userId,
    doctorId: a.doctorId,
    assessmentDate: a.assessmentDate.toISOString(),
    diabetesDuration: a.diabetesDuration,
    baselineHba1c: a.baselineHba1c,
    startingDose: a.startingDose,
    concomitantMeds: a.concomitantMeds,
    treatmentStatus: a.treatmentStatus as ClinicalAssessment['treatmentStatus'],
    discontinuationReason: a.discontinuationReason,
    physicianComments: a.physicianComments,
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function buildPatientDetail(
  prisma: PrismaService,
  patientId: string,
): Promise<DoctorPatientDetail> {
  const p = await prisma.user.findUnique({
    where: { id: patientId },
    include: {
      weightEntries: { orderBy: { recordedAt: 'asc' } },
      hba1cEntries: { orderBy: { recordedAt: 'asc' } },
      adverseEvents: { orderBy: { onsetDate: 'desc' } },
      assessment: true,
      comments: { orderBy: { createdAt: 'desc' }, include: { doctor: true } },
      _count: { select: { adverseEvents: true } },
    },
  });
  if (!p) throw new NotFoundException('Patient not found');

  const sorted = [...p.weightEntries].sort(
    (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime(),
  );
  const latestWeightKg = sorted[0]?.weightKg ?? null;

  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    age: computeAge(p.birthDate),
    gender: p.gender,
    phone: p.phone,
    heightCm: p.heightCm,
    chronicConditions: p.chronicConditions,
    otherConditions: p.otherConditions,
    latestWeightKg,
    bmi: computeBmi(latestWeightKg, p.heightCm),
    bmiCategory: bmiCategory(computeBmi(latestWeightKg, p.heightCm)),
    treatmentStatus: p.assessment?.treatmentStatus ?? null,
    adverseEventCount: p._count.adverseEvents,
    createdAt: p.createdAt.toISOString(),
    assessment: p.assessment ? serializeAssessment(p.assessment) : null,
    weightEntries: p.weightEntries.map((w) => ({
      id: w.id,
      weightKg: w.weightKg,
      recordedAt: w.recordedAt.toISOString(),
      note: w.note,
    })),
    hba1cEntries: p.hba1cEntries.map((h) => ({
      id: h.id,
      value: h.value,
      recordedAt: h.recordedAt.toISOString(),
    })),
    adverseEvents: p.adverseEvents.map((e) => ({
      id: e.id,
      description: e.description,
      severity: e.severity,
      onsetDate: e.onsetDate.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })),
    comments: p.comments.map((c) => ({
      id: c.id,
      body: c.body,
      doctorId: c.doctorId,
      doctorName: c.doctor?.fullName ?? null,
      weightEntryId: c.weightEntryId,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
