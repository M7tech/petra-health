import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest, SignupRequest } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupRequest) {
    return this.auth.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginRequest) {
    return this.auth.loginUser(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: LoginRequest) {
    return this.auth.loginAdmin(dto);
  }

  @Post('doctor/login')
  @HttpCode(HttpStatus.OK)
  doctorLogin(@Body() dto: LoginRequest) {
    return this.auth.loginDoctor(dto);
  }
}
