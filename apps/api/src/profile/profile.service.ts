import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileRequest } from './dto';
import { toAuthUser, computeAge } from '../common/user-mapper';
import { bmiCategory, computeBmi, type PatientProfile } from '@petra/shared';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string): Promise<PatientProfile> {
    return this.buildProfile(userId);
  }

  async update(userId: string, dto: UpdateProfileRequest): Promise<PatientProfile> {
    // Validate the hierarchical selection is internally consistent.
    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
      if (!city) throw new NotFoundException('City not found');
      if (dto.countryId && city.countryId !== dto.countryId) {
        throw new BadRequestException('Selected city is not in the selected country');
      }
    }
    if (dto.doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: dto.doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not found');
      if (dto.cityId && doctor.cityId !== dto.cityId) {
        throw new BadRequestException('Selected doctor does not practice in the selected city');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        heightCm: dto.heightCm,
        chronicConditions: dto.chronicConditions,
        otherConditions: dto.otherConditions,
        countryId: dto.countryId,
        cityId: dto.cityId,
        doctorId: dto.doctorId,
      },
    });

    // A profile weight update is also recorded as a weight entry (drives BMI + trend).
    if (dto.currentWeightKg != null) {
      await this.prisma.weightEntry.create({
        data: { userId, weightKg: dto.currentWeightKg },
      });
    }

    return this.buildProfile(userId);
  }

  private async buildProfile(userId: string): Promise<PatientProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { weightEntries: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    if (!user) throw new NotFoundException('User not found');

    const latestWeightKg = user.weightEntries[0]?.weightKg ?? null;
    const bmi = computeBmi(latestWeightKg, user.heightCm);
    return {
      ...toAuthUser(user),
      latestWeightKg,
      bmi,
      bmiCategory: bmiCategory(bmi),
      age: computeAge(user.birthDate),
    };
  }
}
