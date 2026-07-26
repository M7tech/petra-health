import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './jwt.types';
import {
  AdminLoginRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
} from './dto';
import { toAuthUser } from '../common/user-mapper';
import type {
  AdminLoginResponse,
  DoctorLoginResponse,
  OtpChallengeResponse,
  UserLoginResponse,
} from '@petra/shared';

const BCRYPT_ROUNDS = 12;

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  const shown = name.slice(0, 1);
  return `${shown}${'*'.repeat(Math.max(1, name.length - 1))}@${domain}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private sign(payload: JwtPayload, expiresIn?: string): string {
    return expiresIn ? this.jwt.sign(payload, { expiresIn }) : this.jwt.sign(payload);
  }

  // ---- Patients ----
  async signup(dto: SignupRequest): Promise<UserLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({ data: { email, passwordHash, fullName: dto.fullName } });
    const accessToken = this.sign({ sub: user.id, email: user.email, type: 'user' });
    return { accessToken, user: toAuthUser(user) };
  }

  async loginUser(dto: LoginRequest): Promise<UserLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.sign({ sub: user.id, email: user.email, type: 'user' });
    return { accessToken, user: toAuthUser(user) };
  }

  // ---- Admin / manager: username + password -> OTP -> token ----
  async loginAdmin(dto: AdminLoginRequest): Promise<OtpChallengeResponse> {
    const username = dto.username.toLowerCase().trim();
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const otp = String(crypto.randomInt(100000, 1000000)); // 6 digits
    const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { otpHash, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });
    const sent = await this.mail.sendOtp(admin.email, otp);
    return {
      otpRequired: true,
      sentTo: maskEmail(admin.email),
      // Only exposed when email delivery isn't configured, so the flow is testable.
      devOtp: sent ? undefined : otp,
    };
  }

  async verifyOtp(dto: VerifyOtpRequest): Promise<AdminLoginResponse> {
    const username = dto.username.toLowerCase().trim();
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.otpHash || !admin.otpExpiresAt || admin.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Code expired — please sign in again');
    }
    if (!(await bcrypt.compare(dto.otp, admin.otpHash))) {
      throw new UnauthorizedException('Incorrect code');
    }
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { otpHash: null, otpExpiresAt: null },
    });
    const accessToken = this.sign(
      { sub: admin.id, email: admin.email, type: 'admin', role: admin.role },
      dto.rememberMe ? '30d' : undefined,
    );
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        officeName: admin.officeName,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordRequest): Promise<{ ok: true; devToken?: string }> {
    const id = dto.usernameOrEmail.toLowerCase().trim();
    const admin = await this.prisma.admin.findFirst({
      where: { OR: [{ username: id }, { email: id }] },
    });
    if (!admin) return { ok: true }; // don't reveal whether the account exists

    const raw = crypto.randomBytes(24).toString('hex');
    const resetTokenHash = await bcrypt.hash(raw, BCRYPT_ROUNDS);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { resetTokenHash, resetExpiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const token = `${admin.id}.${raw}`;
    const webUrl = this.config.get<string>('WEB_URL') ?? 'https://petra-health-web.vercel.app';
    const sent = await this.mail.sendReset(admin.email, `${webUrl}/reset?token=${token}`);
    return { ok: true, devToken: sent ? undefined : token };
  }

  async resetPassword(dto: ResetPasswordRequest): Promise<{ ok: true }> {
    const [adminId, raw] = dto.token.split('.');
    const admin = adminId ? await this.prisma.admin.findUnique({ where: { id: adminId } }) : null;
    if (
      !admin ||
      !raw ||
      !admin.resetTokenHash ||
      !admin.resetExpiresAt ||
      admin.resetExpiresAt < new Date() ||
      !(await bcrypt.compare(raw, admin.resetTokenHash))
    ) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash, resetTokenHash: null, resetExpiresAt: null },
    });
    return { ok: true };
  }

  // ---- Doctors ----
  async loginDoctor(dto: LoginRequest): Promise<DoctorLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const doctor = await this.prisma.doctor.findUnique({ where: { email } });
    if (!doctor || !doctor.passwordHash || !(await bcrypt.compare(dto.password, doctor.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.sign({ sub: doctor.id, email, type: 'doctor' });
    return {
      accessToken,
      doctor: { id: doctor.id, email, fullName: doctor.fullName, specialty: doctor.specialty },
    };
  }
}
