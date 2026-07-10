import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsDateString, Min, Max, Length } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

class CreateWeightRequest {
  @IsNumber()
  @Min(20) // sane human-weight bounds (kg)
  @Max(500)
  weightKg!: number;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('me/weights')
export class WeightsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentPrincipal() p: Principal) {
    return this.prisma.weightEntry.findMany({
      where: { userId: p.id },
      orderBy: { recordedAt: 'asc' },
    });
  }

  @Post()
  create(@CurrentPrincipal() p: Principal, @Body() dto: CreateWeightRequest) {
    return this.prisma.weightEntry.create({
      data: {
        userId: p.id,
        weightKg: dto.weightKg,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
        note: dto.note,
      },
    });
  }
}
