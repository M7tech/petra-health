import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateManagerDto, ManagerUser, UpdateManagerDto } from '@petra/shared';

const MANAGER_INCLUDE = {
  managedCities: { include: { country: true } },
} as const;

type ManagerRow = {
  id: string;
  username: string | null;
  email: string;
  fullName: string;
  officeName: string | null;
  role: string;
  managedCities: { id: string; name: string; countryId: string; country: { name: string } }[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ManagerUser[]> {
    const managers = await this.prisma.admin.findMany({
      where: { role: 'EDITOR' },
      orderBy: { createdAt: 'desc' },
      include: MANAGER_INCLUDE,
    });
    return Promise.all(managers.map((m) => this.toManager(m)));
  }

  async create(dto: CreateManagerDto): Promise<ManagerUser> {
    const username = dto.username.toLowerCase().trim();
    const email = dto.email.toLowerCase().trim();
    const clash = await this.prisma.admin.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (clash) throw new BadRequestException('Username or email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const manager = await this.prisma.admin.create({
      data: {
        username,
        email,
        passwordHash,
        fullName: dto.fullName,
        officeName: dto.officeName,
        role: 'EDITOR',
        managedCities: dto.cityIds?.length ? { connect: dto.cityIds.map((id) => ({ id })) } : undefined,
      },
    });
    return this.get(manager.id);
  }

  async update(id: string, dto: UpdateManagerDto): Promise<ManagerUser> {
    const manager = await this.prisma.admin.findUnique({ where: { id } });
    if (!manager || manager.role !== 'EDITOR') throw new NotFoundException('Manager not found');

    await this.prisma.admin.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        officeName: dto.officeName,
        ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 12) } : {}),
        // `set` replaces the manager's whole city assignment with this list.
        ...(dto.cityIds ? { managedCities: { set: dto.cityIds.map((cid) => ({ id: cid })) } } : {}),
      },
    });
    return this.get(id);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const manager = await this.prisma.admin.findUnique({ where: { id } });
    if (!manager || manager.role !== 'EDITOR') throw new NotFoundException('Manager not found');
    await this.prisma.admin.delete({ where: { id } });
    return { ok: true };
  }

  private async get(id: string): Promise<ManagerUser> {
    const m = await this.prisma.admin.findUnique({ where: { id }, include: MANAGER_INCLUDE });
    if (!m) throw new NotFoundException('Manager not found');
    return this.toManager(m);
  }

  private async toManager(m: ManagerRow): Promise<ManagerUser> {
    const cityIds = m.managedCities.map((c) => c.id);
    const [doctorCount, patientCount] = cityIds.length
      ? await Promise.all([
          this.prisma.doctor.count({ where: { cityId: { in: cityIds } } }),
          this.prisma.user.count({ where: { cityId: { in: cityIds } } }),
        ])
      : [0, 0];

    return {
      id: m.id,
      username: m.username,
      email: m.email,
      fullName: m.fullName,
      officeName: m.officeName,
      role: m.role as ManagerUser['role'],
      cities: m.managedCities.map((c) => ({
        id: c.id,
        name: c.name,
        countryId: c.countryId,
        countryName: c.country.name,
      })),
      doctorCount,
      patientCount,
    };
  }
}
