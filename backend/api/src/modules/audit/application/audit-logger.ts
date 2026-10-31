import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tram/database';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';

export interface AuditEntry {
  actorId: string;
  action: string; // "video.publish", "wallet.adjust", "user.lock"...
  targetType: string;
  targetId: string;
  data?: Prisma.InputJsonValue;
}

/**
 * Ghi nhật ký thao tác admin. Chạy trong cùng transaction với thao tác
 * (nếu thao tác rollback thì log cũng rollback).
 */
@Injectable()
export class AuditLogger {
  constructor(private readonly txHost: TransactionHost) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.txHost.tx.auditLog.create({ data: entry });
  }
}
