import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyRequest, UpdatePharmacyRequest } from './dto';
import type { Pharmacy } from '@petra/shared';

@Injectable()
export class PharmaciesService {
  constructor(private readonly prisma: PrismaService) {}

  // Patients/doctors only ever see active pharmacies; admins manage all of
  // them (including disabled ones) from the dashboard.
  async list(includeInactive: boolean): Promise<Pharmacy[]> {
    const rows = await this.prisma.pharmacy.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(this.serialize);
  }

  async create(dto: CreatePharmacyRequest): Promise<Pharmacy> {
    const row = await this.prisma.pharmacy.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        active: dto.active ?? true,
      },
    });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdatePharmacyRequest): Promise<Pharmacy> {
    const existing = await this.prisma.pharmacy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pharmacy not found');
    const row = await this.prisma.pharmacy.update({ where: { id }, data: dto });
    return this.serialize(row);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.pharmacy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pharmacy not found');
    await this.prisma.pharmacy.delete({ where: { id } });
    return { ok: true };
  }

  private serialize(p: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
    active: boolean;
    createdAt: Date;
  }): Pharmacy {
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
