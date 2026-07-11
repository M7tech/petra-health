import { Module } from '@nestjs/common';
import { ClinicalController } from './clinical.controller';

@Module({
  controllers: [ClinicalController],
})
export class ClinicalModule {}
