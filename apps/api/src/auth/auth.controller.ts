import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AdminLoginRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
} from './dto';

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

  // Admin/manager: step 1 (username+password -> OTP), step 2 (verify OTP)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: AdminLoginRequest) {
    return this.auth.loginAdmin(dto);
  }

  @Post('admin/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpRequest) {
    return this.auth.verifyOtp(dto);
  }

  @Post('admin/forgot')
  @HttpCode(HttpStatus.OK)
  forgot(@Body() dto: ForgotPasswordRequest) {
    return this.auth.forgotPassword(dto);
  }

  @Post('admin/reset')
  @HttpCode(HttpStatus.OK)
  reset(@Body() dto: ResetPasswordRequest) {
    return this.auth.resetPassword(dto);
  }

  @Post('doctor/login')
  @HttpCode(HttpStatus.OK)
  doctorLogin(@Body() dto: LoginRequest) {
    return this.auth.loginDoctor(dto);
  }
}
