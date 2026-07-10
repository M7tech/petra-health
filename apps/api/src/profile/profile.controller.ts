import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileRequest } from './dto';
import { JwtAuthGuard, CurrentPrincipal } from '../auth/guards';
import { Principal } from '../auth/jwt.types';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  me(@CurrentPrincipal() principal: Principal) {
    return this.profile.me(principal.id);
  }

  @Put()
  update(@CurrentPrincipal() principal: Principal, @Body() dto: UpdateProfileRequest) {
    return this.profile.update(principal.id, dto);
  }
}
