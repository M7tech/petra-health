import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCityRequest, UpsertCountryRequest, UpsertDoctorRequest } from './dto';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Reads (used by onboarding dropdowns) ----
  listCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  listCities(countryId?: string) {
    return this.prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  listDoctors(params: { cityId?: string; countryId?: string }) {
    return this.prisma.doctor.findMany({
      where: {
        cityId: params.cityId,
        countryId: params.countryId,
      },
      orderBy: { fullName: 'asc' },
      // Never expose passwordHash to clients.
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
    });
  }

  // ---- Country CRUD ----
  createCountry(dto: UpsertCountryRequest) {
    return this.prisma.country.create({ data: dto });
  }

  async updateCountry(id: string, dto: UpsertCountryRequest) {
    await this.ensureCountry(id);
    return this.prisma.country.update({ where: { id }, data: dto });
  }

  async deleteCountry(id: string) {
    await this.ensureCountry(id);
    // Cities/doctors cascade per schema.
    await this.prisma.country.delete({ where: { id } });
    return { ok: true };
  }

  // ---- City CRUD ----
  async createCity(dto: UpsertCityRequest) {
    await this.ensureCountry(dto.countryId);
    return this.prisma.city.create({ data: dto });
  }

  async updateCity(id: string, dto: UpsertCityRequest) {
    await this.ensureCity(id);
    await this.ensureCountry(dto.countryId);
    return this.prisma.city.update({ where: { id }, data: dto });
  }

  async deleteCity(id: string) {
    await this.ensureCity(id);
    await this.prisma.city.delete({ where: { id } });
    return { ok: true };
  }

  // Never return passwordHash to clients.
  private static readonly DOCTOR_SELECT = {
    id: true,
    fullName: true,
    specialty: true,
    phone: true,
    cityId: true,
    countryId: true,
    email: true,
    managerId: true,
  } as const;

  // ---- Doctor CRUD ----
  async createDoctor(dto: UpsertDoctorRequest) {
    await this.assertCityInCountry(dto.cityId, dto.countryId);
    return this.prisma.doctor.create({
      data: await this.doctorData(dto),
      select: DirectoryService.DOCTOR_SELECT,
    });
  }

  async updateDoctor(id: string, dto: UpsertDoctorRequest) {
    await this.ensureDoctor(id);
    await this.assertCityInCountry(dto.cityId, dto.countryId);
    return this.prisma.doctor.update({
      where: { id },
      data: await this.doctorData(dto),
      select: DirectoryService.DOCTOR_SELECT,
    });
  }

  // Builds doctor write-data, hashing an optional login password and
  // normalizing the optional email / manager assignment.
  private async doctorData(dto: UpsertDoctorRequest): Promise<Prisma.DoctorUncheckedCreateInput> {
    const data: Prisma.DoctorUncheckedCreateInput = {
      fullName: dto.fullName,
      specialty: dto.specialty,
      phone: dto.phone,
      cityId: dto.cityId,
      countryId: dto.countryId,
    };
    if (dto.managerId !== undefined) data.managerId = dto.managerId || null;
    if (dto.email !== undefined) data.email = dto.email ? dto.email.toLowerCase().trim() : null;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);
    return data;
  }

  async deleteDoctor(id: string) {
    await this.ensureDoctor(id);
    await this.prisma.doctor.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Guards / integrity ----
  private async ensureCountry(id: string) {
    const found = await this.prisma.country.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Country not found');
  }

  private async ensureCity(id: string) {
    const found = await this.prisma.city.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('City not found');
  }

  private async ensureDoctor(id: string) {
    const found = await this.prisma.doctor.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Doctor not found');
  }

  // A doctor's city must belong to the given country (relational integrity
  // beyond raw FKs, since Doctor holds both cityId and countryId).
  private async assertCityInCountry(cityId: string, countryId: string) {
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    if (city.countryId !== countryId) {
      throw new BadRequestException('City does not belong to the specified country');
    }
  }
}
