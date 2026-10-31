import { Global, Module } from '@nestjs/common';
import { AuditLogger } from './application/audit-logger';
import { ListAuditLogsQuery } from './application/list-audit-logs.query';
import { AdminAuditController } from './presentation/admin-audit.controller';

/** Module làm gọn: không có tầng domain. AuditLogger dùng chung mọi module. */
@Global()
@Module({
  controllers: [AdminAuditController],
  providers: [AuditLogger, ListAuditLogsQuery],
  exports: [AuditLogger],
})
export class AuditModule {}
