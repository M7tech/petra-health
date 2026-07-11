import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateCommentRequest, UpsertAssessmentRequest } from './dto';
import { JwtAuthGuard, DoctorGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

@UseGuards(JwtAuthGuard, DoctorGuard)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctor: DoctorService) {}

  @Get('patients')
  patients(@CurrentPrincipal() p: Principal) {
    return this.doctor.listPatients(p.id);
  }

  @Get('patients/:id')
  patient(@CurrentPrincipal() p: Principal, @Param('id') id: string) {
    return this.doctor.getPatient(p.id, id);
  }

  @Put('patients/:id/assessment')
  assessment(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body() dto: UpsertAssessmentRequest,
  ) {
    return this.doctor.upsertAssessment(p.id, id, dto);
  }

  @Post('patients/:id/comments')
  comment(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body() dto: CreateCommentRequest,
  ) {
    return this.doctor.addComment(p.id, id, dto);
  }
}
