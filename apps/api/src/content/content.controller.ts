import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentRequest, UpdateContentRequest } from './dto';
import { JwtAuthGuard, SuperAdminGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';
import type { ContentType } from '@petra/shared';

// Read: any authenticated principal (patient, doctor, or admin/manager).
// Write: super-admin only ("main admin" publishes Training & News).
@UseGuards(JwtAuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list(@Query('type') type?: ContentType) {
    return this.content.list(type);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.content.get(id);
  }

  @UseGuards(SuperAdminGuard)
  @Post()
  create(@CurrentPrincipal() p: Principal, @Body() dto: CreateContentRequest) {
    return this.content.create(p.id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContentRequest) {
    return this.content.update(id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.content.remove(id);
  }
}
