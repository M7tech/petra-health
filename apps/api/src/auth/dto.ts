import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, MaxLength, Length } from 'class-validator';

export class AdminLoginRequest {
  @IsString() @Length(3, 40) username!: string;
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
}

export class VerifyOtpRequest {
  @IsString() @Length(3, 40) username!: string;
  @IsString() @Length(4, 8) otp!: string;
  @IsOptional() @IsBoolean() rememberMe?: boolean;
}

export class ForgotPasswordRequest {
  @IsString() @Length(3, 120) usernameOrEmail!: string;
}

export class ResetPasswordRequest {
  @IsString() @Length(10, 200) token!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
}

export class LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt truncates beyond 72 bytes
  password!: string;
}

export class SignupRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;
}
