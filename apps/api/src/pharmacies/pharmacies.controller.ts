import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { CreatePharmacyRequest, UpdatePharmacyRequest } from './dto';
import { JwtAuthGuard, SuperAdminGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

// Read: any authenticated principal — patients/doctors get active-only,
// admins (any role) get the full list including disabled ones.
// Write: super-admin only.
@UseGuards(JwtAuthGuard)
@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmacies: PharmaciesService) {}

  @Get()
  list(@CurrentPrincipal() p: Principal) {
    return this.pharmacies.list(p.type === 'admin');
  }

  @UseGuards(SuperAdminGuard)
  @Post()
  create(@Body() dto: CreatePharmacyRequest) {
    return this.pharmacies.create(dto);
  }

  @UseGuards(SuperAdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePharmacyRequest) {
    return this.pharmacies.update(id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pharmacies.remove(id);
  }
}
