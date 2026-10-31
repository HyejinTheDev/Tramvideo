import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';
import { paginationQuery } from '@tram/shared';
import { Roles } from '../../../shared/presentation/decorators';
import { ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { ListAuditLogsQuery } from '../application/list-audit-logs.query';

const auditQuery = paginationQuery.extend({
  targetType: z.string().max(50).optional(),
  targetId: z.string().max(64).optional(),
});

@Controller('admin/audit-logs')
@Roles('ADMIN')
export class AdminAuditController {
  constructor(private readonly listAuditLogs: ListAuditLogsQuery) {}

  @Get()
  list(@ZodQuery(auditQuery) q: z.infer<typeof auditQuery>) {
    return this.listAuditLogs.execute(q);
  }
}
