import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyRequest, UpdatePharmacyRequest } from './dto';
import type { Pharmacy } from '@petra/shared';

// Coordinate patterns seen across the various Google Maps URL shapes, tried
// in priority order — "!3d..!4d.." is the precise pin/place coordinate,
// "@lat,lng" is the map viewport center (present on almost every share
// link), "q="/"ll=" are older-style query params.
const COORD_PATTERNS = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
];

function extractCoords(url: string): { latitude: number; longitude: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const m = url.match(pattern);
    if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };
  }
  return null;
}

@Injectable()
export class PharmaciesService {
  constructor(private readonly prisma: PrismaService) {}

  // Accepts a pasted Google Maps share link (long or short — maps.app.goo.gl
  // etc.) and returns the coordinates embedded in it. Short links only carry
  // coordinates after their redirect resolves, and that redirect target
  // (google.com) doesn't send permissive CORS headers, so this has to
  // happen server-side rather than via a client-side fetch.
  async resolveLocation(url: string): Promise<{ latitude: number; longitude: number }> {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      throw new BadRequestException('That does not look like a valid link');
    }
    if (!/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$/i.test(target.hostname)) {
      throw new BadRequestException('Paste a Google Maps link (google.com/maps or maps.app.goo.gl)');
    }

    const direct = extractCoords(url);
    if (direct) return direct;

    // Short links carry no coordinates until resolved — follow the redirect.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
      clearTimeout(timeout);
      const resolved = extractCoords(res.url);
      if (resolved) return resolved;
    } catch {
      /* fall through to the error below */
    }

    throw new BadRequestException(
      'Could not find coordinates in that link — try sharing the pin location directly from Google Maps',
    );
  }

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
