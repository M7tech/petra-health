import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt.types';
import { LoginRequest, SignupRequest } from './dto';
import type { AdminLoginResponse, UserLoginResponse } from '@petra/shared';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }

  async signup(dto: SignupRequest): Promise<UserLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, fullName: dto.fullName },
    });
    const accessToken = this.sign({ sub: user.id, email: user.email, type: 'user' });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        countryId: user.countryId,
        cityId: user.cityId,
        doctorId: user.doctorId,
      },
    };
  }

  async loginUser(dto: LoginRequest): Promise<UserLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.sign({ sub: user.id, email: user.email, type: 'user' });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        countryId: user.countryId,
        cityId: user.cityId,
        doctorId: user.doctorId,
      },
    };
  }

  async loginAdmin(dto: LoginRequest): Promise<AdminLoginResponse> {
    const email = dto.email.toLowerCase().trim();
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.sign({
      sub: admin.id,
      email: admin.email,
      type: 'admin',
      role: admin.role,
    });
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }
}
