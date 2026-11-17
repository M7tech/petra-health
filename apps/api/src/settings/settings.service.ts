import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DOCTOR_FEATURES = 'doctorFeatures';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Doctor features (choosing a doctor, chatting with them) are ON unless an
  // admin explicitly switches them off, so existing deployments keep working.
  async doctorFeaturesEnabled(): Promise<boolean> {
    const row = await this.prisma.appSetting.findUnique({ where: { key: DOCTOR_FEATURES } });
    return row ? row.value === 'true' : true;
  }

  async setDoctorFeatures(enabled: boolean) {
    await this.prisma.appSetting.upsert({
      where: { key: DOCTOR_FEATURES },
      update: { value: String(enabled) },
      create: { key: DOCTOR_FEATURES, value: String(enabled) },
    });
    return this.getPublicConfig();
  }

  async getPublicConfig() {
    return { doctorFeatures: await this.doctorFeaturesEnabled() };
  }
}
