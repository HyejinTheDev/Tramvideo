import { Module } from '@nestjs/common';
import { StatsQueryService } from './application/stats.query';
import { StatsController } from './presentation/stats.controller';

@Module({
  controllers: [StatsController],
  providers: [StatsQueryService],
})
export class StatsModule {}
