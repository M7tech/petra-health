import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { AdminService } from './admin.service';
import { AdminGuard, JwtAuthGuard } from '../auth/guards';

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

  @Get('patients')
  patients() {
    return this.admin.listPatients();
  }

  @Get('patients/:id')
  patient(@Param('id') id: string) {
    return this.admin.getPatient(id);
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
