import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, SuperAdminGuard } from '../auth/guards';

class UpdateConfigRequest {
  @IsBoolean() doctorFeatures!: boolean;
}

@Controller('config')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Public: the mobile app reads this to decide whether to show doctors and chat.
  @Get()
  get() {
    return this.settings.getPublicConfig();
  }

  // Only the super-admin can flip the switch.
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Put()
  update(@Body() dto: UpdateConfigRequest) {
    return this.settings.setDoctorFeatures(dto.doctorFeatures);
  }
}
