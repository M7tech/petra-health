import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateManagerDto, ManagerUser, UpdateManagerDto } from '@petra/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ManagerUser[]> {
    const managers = await this.prisma.admin.findMany({
      where: { role: 'EDITOR' },
      orderBy: { createdAt: 'desc' },
      include: { managedDoctors: { select: { id: true } } },
    });
    return managers.map((m) => this.toManager(m));
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
      },
    });
    await this.assignDoctors(manager.id, dto.doctorIds ?? []);
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
      },
    });
    if (dto.doctorIds) await this.assignDoctors(id, dto.doctorIds);
    return this.get(id);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const manager = await this.prisma.admin.findUnique({ where: { id } });
    if (!manager || manager.role !== 'EDITOR') throw new NotFoundException('Manager not found');
    await this.prisma.admin.delete({ where: { id } }); // doctors' managerId -> null (SetNull)
    return { ok: true };
  }

  // Set this manager as the owner of exactly `doctorIds` (release the rest).
  private async assignDoctors(managerId: string, doctorIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.doctor.updateMany({ where: { managerId }, data: { managerId: null } }),
      ...(doctorIds.length
        ? [this.prisma.doctor.updateMany({ where: { id: { in: doctorIds } }, data: { managerId } })]
        : []),
    ]);
  }

  private async get(id: string): Promise<ManagerUser> {
    const m = await this.prisma.admin.findUnique({
      where: { id },
      include: { managedDoctors: { select: { id: true } } },
    });
    if (!m) throw new NotFoundException('Manager not found');
    return this.toManager(m);
  }

  private toManager(m: {
    id: string;
    username: string | null;
    email: string;
    fullName: string;
    officeName: string | null;
    role: string;
    managedDoctors: { id: string }[];
  }): ManagerUser {
    return {
      id: m.id,
      username: m.username,
      email: m.email,
      fullName: m.fullName,
      officeName: m.officeName,
      role: m.role as ManagerUser['role'],
      doctorCount: m.managedDoctors.length,
      doctorIds: m.managedDoctors.map((d) => d.id),
    };
  }
}
