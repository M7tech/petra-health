import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { AdminService } from './admin.service';
import { AdminGuard, JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

class ReplyRequest {
  @IsString() @Length(1, 1000) body!: string;
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

  @Get('patients')
  patients(@CurrentPrincipal() p: Principal) {
    return this.admin.listPatients(p);
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
