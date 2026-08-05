import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { AdminService } from './admin.service';
import { AdminGuard, JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

class ReplyRequest {
  @IsString() @Length(1, 1000) body!: string;
}

class UpdateSelfRequest {
  @IsOptional()
  @Matches(/^\+\d{6,15}$/, { message: 'whatsappPhone must be E.164, e.g. +9647500000000' })
  whatsappPhone?: string;
}

// Everything here requires a valid admin JWT — admins can read all patient data.
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  // What the logged-in admin/manager is scoped to (their assigned region).
  @Get('me')
  me(@CurrentPrincipal() p: Principal) {
    return this.admin.myScope(p);
  }

  // Self-service: any admin/manager can set their own WhatsApp number.
  @Put('me')
  updateMe(@CurrentPrincipal() p: Principal, @Body() dto: UpdateSelfRequest) {
    return this.admin.updateSelf(p, dto.whatsappPhone);
  }

  @Get('patients')
  patients(@CurrentPrincipal() p: Principal) {
    return this.admin.listPatients(p);
  }

  @Get('reports')
  reports(@CurrentPrincipal() p: Principal) {
    return this.admin.getReports(p);
  }

  @Get('patients-map')
  patientsMap(@CurrentPrincipal() p: Principal) {
    return this.admin.listPatientLocations(p);
  }

  @Get('patients/:id')
  patient(@CurrentPrincipal() p: Principal, @Param('id') id: string) {
    return this.admin.getPatient(id, p);
  }

  @Get('messages')
  messageThreads() {
    return this.admin.messageThreads();
  }

  @Get('messages/:userId')
  thread(@Param('userId') userId: string) {
    return this.admin.thread(userId);
  }

  @Post('messages/:userId')
  reply(@Param('userId') userId: string, @Body() dto: ReplyRequest) {
    return this.admin.reply(userId, dto.body);
  }
}
