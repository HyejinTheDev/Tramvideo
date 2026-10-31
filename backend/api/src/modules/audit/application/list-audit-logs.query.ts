import { Injectable } from '@nestjs/common';
import type { AuditLog, Paginated, PaginationQuery } from '@tram/shared';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';

@Injectable()
export class ListAuditLogsQuery {
  constructor(private readonly txHost: TransactionHost) {}

  async execute(q: PaginationQuery & { targetType?: string; targetId?: string }): Promise<
    Paginated<AuditLog>
  > {
    const db = this.txHost.tx;
    const where = {
      ...(q.targetType ? { targetType: q.targetType } : {}),
      ...(q.targetId ? { targetId: q.targetId } : {}),
    };
    const [rows, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.auditLog.count({ where }),
    ]);
    const actorIds = [...new Set(rows.map((r) => r.actorId))];
    const actors = await db.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true },
    });
    const emailById = new Map(actors.map((a) => [a.id, a.email]));
    return {
      items: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        actorEmail: emailById.get(r.actorId) ?? null,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        data: r.data,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}
