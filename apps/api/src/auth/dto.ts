import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

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
