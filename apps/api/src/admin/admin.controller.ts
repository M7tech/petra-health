import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard, JwtAuthGuard } from '../auth/guards';

// Everything here requires a valid admin JWT — admins can read all patient data.
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  @Get('patients')
  patients() {
    return this.admin.listPatients();
  }

  @Get('patients/:id')
  patient(@Param('id') id: string) {
    return this.admin.getPatient(id);
  }
}
