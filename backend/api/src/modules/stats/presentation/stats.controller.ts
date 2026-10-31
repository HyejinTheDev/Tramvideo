import { Controller, Get } from '@nestjs/common';
import { statsQuery, type StatsQuery } from '@tram/shared';
import { Roles } from '../../../shared/presentation/decorators';
import { ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { StatsQueryService } from '../application/stats.query';

@Controller('admin/stats')
@Roles('ADMIN')
export class StatsController {
  constructor(private readonly stats: StatsQueryService) {}

  @Get()
  get(@ZodQuery(statsQuery) q: StatsQuery) {
    return this.stats.execute(q);
  }
}
