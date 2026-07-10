import { Module } from '@nestjs/common';
import { WeightsController } from './weights.controller';

@Module({
  controllers: [WeightsController],
})
export class WeightsModule {}
