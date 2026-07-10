import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { EnrollMedicationRequest, LogDoseRequest } from './dto';
import { JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

@UseGuards(JwtAuthGuard)
@Controller()
export class MedicationsController {
  constructor(private readonly meds: MedicationsService) {}

  // ---- Catalog ----
  @Get('medications')
  catalog() {
    return this.meds.listCatalog();
  }

  @Get('medications/:id')
  one(@Param('id') id: string) {
    return this.meds.getMedication(id);
  }

  // ---- Patient's own medications + dose logs ----
  @Get('me/medications')
  mine(@CurrentPrincipal() p: Principal) {
    return this.meds.listMine(p.id);
  }

  @Post('me/medications')
  enroll(@CurrentPrincipal() p: Principal, @Body() dto: EnrollMedicationRequest) {
    return this.meds.enroll(p.id, dto);
  }

  @Get('me/doses')
  doses(@CurrentPrincipal() p: Principal, @Query('userMedicationId') umId?: string) {
    return this.meds.listDoses(p.id, umId);
  }

  @Post('me/doses')
  logDose(@CurrentPrincipal() p: Principal, @Body() dto: LogDoseRequest) {
    return this.meds.logDose(p.id, dto);
  }
}
