import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DirectoryModule } from './directory/directory.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { MedicationsModule } from './medications/medications.module';
import { WeightsModule } from './weights/weights.module';

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
  ],
})
export class AppModule {}
