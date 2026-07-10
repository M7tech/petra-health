import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollMedicationRequest, LogDoseRequest } from './dto';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Catalog (Semetra with pens + titration weeks) ----
  listCatalog() {
    return this.prisma.medication.findMany({
      orderBy: { name: 'asc' },
      include: {
        pens: {
          orderBy: { sequence: 'asc' },
          include: { weeks: { orderBy: { weekNumber: 'asc' } } },
        },
      },
    });
  }

  async getMedication(id: string) {
    const med = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        pens: {
          orderBy: { sequence: 'asc' },
          include: { weeks: { orderBy: { weekNumber: 'asc' } } },
        },
      },
    });
    if (!med) throw new NotFoundException('Medication not found');
    return med;
  }

  // ---- Patient's own medications ----
  listMine(userId: string) {
    return this.prisma.userMedication.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { doseLogs: true } } },
    });
  }

  enroll(userId: string, dto: EnrollMedicationRequest) {
    return this.prisma.userMedication.create({
      data: {
        userId,
        medicationId: dto.medicationId ?? '',
        name: dto.name,
        dosage: dto.dosage,
        frequency: dto.frequency,
        timeOfDay: dto.timeOfDay,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async logDose(userId: string, dto: LogDoseRequest) {
    // Ensure the medication belongs to this patient before logging.
    const med = await this.prisma.userMedication.findUnique({
      where: { id: dto.userMedicationId },
    });
    if (!med) throw new NotFoundException('Medication not found');
    if (med.userId !== userId) throw new ForbiddenException('Not your medication');

    return this.prisma.doseLog.create({
      data: {
        userId,
        userMedicationId: dto.userMedicationId,
        scheduledFor: new Date(dto.scheduledFor),
        doseMg: dto.doseMg,
        note: dto.note,
      },
    });
  }

  listDoses(userId: string, userMedicationId?: string) {
    return this.prisma.doseLog.findMany({
      where: { userId, userMedicationId: userMedicationId || undefined },
      orderBy: { scheduledFor: 'asc' },
    });
  }
}
