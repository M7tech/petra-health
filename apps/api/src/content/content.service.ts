import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ContentPost, ContentType } from '@petra/shared';
import { CreateContentRequest, UpdateContentRequest } from './dto';

type PostRow = {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string | null;
  titleKu: string | null;
  bodyEn: string | null;
  bodyAr: string | null;
  bodyKu: string | null;
  videoUrlEn: string | null;
  videoUrlAr: string | null;
  videoUrlKu: string | null;
  photoUrls: string[];
  publishedAt: Date;
  updatedAt: Date;
  author: { fullName: string } | null;
};

function serialize(p: PostRow): ContentPost {
  return {
    id: p.id,
    type: p.type as ContentType,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    titleKu: p.titleKu,
    bodyEn: p.bodyEn,
    bodyAr: p.bodyAr,
    bodyKu: p.bodyKu,
    videoUrlEn: p.videoUrlEn,
    videoUrlAr: p.videoUrlAr,
    videoUrlKu: p.videoUrlKu,
    photoUrls: p.photoUrls,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    authorName: p.author?.fullName ?? null,
  };
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type?: ContentType): Promise<ContentPost[]> {
    const rows = await this.prisma.contentPost.findMany({
      where: type ? { type } : undefined,
      orderBy: { publishedAt: 'desc' },
      include: { author: { select: { fullName: true } } },
    });
    return rows.map(serialize);
  }

  async get(id: string): Promise<ContentPost> {
    const row = await this.prisma.contentPost.findUnique({
      where: { id },
      include: { author: { select: { fullName: true } } },
    });
    if (!row) throw new NotFoundException('Post not found');
    return serialize(row);
  }

  async create(authorId: string, dto: CreateContentRequest): Promise<ContentPost> {
    const row = await this.prisma.contentPost.create({
      data: { ...dto, authorId },
      include: { author: { select: { fullName: true } } },
    });
    return serialize(row);
  }

  async update(id: string, dto: UpdateContentRequest): Promise<ContentPost> {
    await this.get(id); // 404 if missing
    const row = await this.prisma.contentPost.update({
      where: { id },
      data: dto,
      include: { author: { select: { fullName: true } } },
    });
    return serialize(row);
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.get(id); // 404 if missing
    await this.prisma.contentPost.delete({ where: { id } });
    return { ok: true };
  }
}
