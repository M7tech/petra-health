import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileRequest } from './dto';
import type { AuthUser } from '@petra/shared';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.toAuthUser(user);
  }

  async update(userId: string, dto: UpdateProfileRequest): Promise<AuthUser> {
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

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        countryId: dto.countryId,
        cityId: dto.cityId,
        doctorId: dto.doctorId,
      },
    });
    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    fullName: string;
    countryId: string | null;
    cityId: string | null;
    doctorId: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      countryId: user.countryId,
      cityId: user.cityId,
      doctorId: user.doctorId,
    };
  }
}
