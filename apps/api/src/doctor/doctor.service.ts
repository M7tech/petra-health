import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeAge } from '../common/user-mapper';
import { bmiCategory, computeBmi } from '@petra/shared';
import type {
  ClinicalAssessment,
  DoctorPatientDetail,
  DoctorPatientSummary,
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
