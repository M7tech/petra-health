import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DirectoryModule } from './directory/directory.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { MedicationsModule } from './medications/medications.module';
import { WeightsModule } from './weights/weights.module';
import { DoctorModule } from './doctor/doctor.module';
import { ClinicalModule } from './clinical/clinical.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    PrismaModule,
    AuthModule,
    DirectoryModule,
    ProfileModule,
    AdminModule,
    MedicationsModule,
    WeightsModule,
    DoctorModule,
    ClinicalModule,
    MailModule,
    UsersModule,
    PushModule,
  ],
})
export class AppModule {}
