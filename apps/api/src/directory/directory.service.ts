import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  // ---- Doctor CRUD ----
  async createDoctor(dto: UpsertDoctorRequest) {
    await this.assertCityInCountry(dto.cityId, dto.countryId);
    return this.prisma.doctor.create({ data: dto });
  }

  async updateDoctor(id: string, dto: UpsertDoctorRequest) {
    await this.ensureDoctor(id);
    await this.assertCityInCountry(dto.cityId, dto.countryId);
    return this.prisma.doctor.update({ where: { id }, data: dto });
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
