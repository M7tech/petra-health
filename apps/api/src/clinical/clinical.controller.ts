import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsDateString, IsNumber, Length, Min, Max } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';
import { serializeAssessment } from '../doctor/doctor.service';
import type { AdverseSeverity, TreatmentStatus } from '@petra/shared';

class CreateHba1cRequest {
  @IsNumber() @Min(3) @Max(20) value!: number;
  @IsOptional() @IsDateString() recordedAt?: string;
}

class CreateMessageRequest {
  @IsString() @Length(1, 1000) body!: string;
}

class RegisterPushTokenRequest {
  @IsString() @Length(1, 200) token!: string;
}

class CreateAdverseEventRequest {
  @IsString() @Length(2, 300) description!: string;
  @IsOptional() @IsIn(['MILD', 'MODERATE', 'SEVERE']) severity?: AdverseSeverity;
  @IsOptional() @IsDateString() onsetDate?: string;
}

class PatientTreatmentRequest {
  @IsOptional() @IsIn(['ONGOING', 'COMPLETED', 'DISCONTINUED']) treatmentStatus?: TreatmentStatus;
  @IsOptional() @IsString() @Length(0, 500) discontinuationReason?: string;
}

// Patient-facing clinical endpoints (their own data only).
@UseGuards(JwtAuthGuard)
@Controller('me')
export class ClinicalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('adverse-events')
  listAdverseEvents(@CurrentPrincipal() p: Principal) {
    return this.prisma.adverseEvent.findMany({
      where: { userId: p.id },
      orderBy: { onsetDate: 'desc' },
    });
  }

  @Post('adverse-events')
  createAdverseEvent(@CurrentPrincipal() p: Principal, @Body() dto: CreateAdverseEventRequest) {
    return this.prisma.adverseEvent.create({
      data: {
        userId: p.id,
        description: dto.description,
        severity: dto.severity ?? 'MILD',
        onsetDate: dto.onsetDate ? new Date(dto.onsetDate) : undefined,
      },
    });
  }

  @Get('comments')
  async comments(@CurrentPrincipal() p: Principal) {
    const rows = await this.prisma.patientComment.findMany({
      where: { userId: p.id },
      orderBy: { createdAt: 'desc' },
      include: { doctor: true },
    });
    return rows.map((c) => ({
      id: c.id,
      body: c.body,
      doctorId: c.doctorId,
      doctorName: c.doctor?.fullName ?? null,
      weightEntryId: c.weightEntryId,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  @Get('hba1c')
  listHba1c(@CurrentPrincipal() p: Principal) {
    return this.prisma.hba1cEntry.findMany({
      where: { userId: p.id },
      orderBy: { recordedAt: 'asc' },
    });
  }

  @Post('hba1c')
  createHba1c(@CurrentPrincipal() p: Principal, @Body() dto: CreateHba1cRequest) {
    return this.prisma.hba1cEntry.create({
      data: {
        userId: p.id,
        value: dto.value,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
      },
    });
  }

  @Get('messages')
  messages(@CurrentPrincipal() p: Principal) {
    return this.prisma.supportMessage.findMany({
      where: { userId: p.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('messages')
  sendMessage(@CurrentPrincipal() p: Principal, @Body() dto: CreateMessageRequest) {
    return this.prisma.supportMessage.create({
      data: { userId: p.id, sender: 'PATIENT', body: dto.body },
    });
  }

  // Registers this device's Expo push token so admin replies can be
  // delivered even when the app isn't running (requires a dev/prod build,
  // not Expo Go, which no longer supports remote push).
  @Post('push-token')
  async registerPushToken(@CurrentPrincipal() p: Principal, @Body() dto: RegisterPushTokenRequest) {
    await this.prisma.user.update({ where: { id: p.id }, data: { pushToken: dto.token } });
    return { ok: true };
  }

  @Get('assessment')
  async assessment(@CurrentPrincipal() p: Principal) {
    const a = await this.prisma.clinicalAssessment.findUnique({ where: { userId: p.id } });
    return a ? serializeAssessment(a) : null;
  }

  // Patient can mark their own treatment as continued/ended and give a reason.
  @Put('treatment')
  async setTreatment(@CurrentPrincipal() p: Principal, @Body() dto: PatientTreatmentRequest) {
    const a = await this.prisma.clinicalAssessment.upsert({
      where: { userId: p.id },
      update: {
        treatmentStatus: dto.treatmentStatus,
        discontinuationReason: dto.discontinuationReason,
      },
      create: {
        userId: p.id,
        treatmentStatus: dto.treatmentStatus ?? 'ONGOING',
        discontinuationReason: dto.discontinuationReason,
      },
    });
    return serializeAssessment(a);
  }
}
