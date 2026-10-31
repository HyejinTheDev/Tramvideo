import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tram/database';
import type { AdminUser, AdminUsersQuery, Paginated } from '@tram/shared';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { DomainError, NotFoundError } from '../../../shared/domain/domain-error';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { AuditLogger } from '../../audit/application/audit-logger';
import { SessionService } from '../../auth/domain/session';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly txHost: TransactionHost) {}

  async execute(q: AdminUsersQuery): Promise<Paginated<AdminUser>> {
    const db = this.txHost.tx;
    const where: Prisma.UserWhereInput = q.q
      ? {
          OR: [
            { email: { contains: q.q, mode: 'insensitive' } },
            { name: { contains: q.q, mode: 'insensitive' } },
            { id: q.q },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        include: { wallet: { select: { balance: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.user.count({ where }),
    ]);
    return {
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        balance: u.wallet?.balance ?? 0,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}

/** Khoá / mở khoá tài khoản. Khoá → thu hồi mọi phiên đăng nhập. */
@Injectable()
export class SetUserLockUseCase {
  constructor(
    private readonly txHost: TransactionHost,
    private readonly sessions: SessionService,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(adminId: string, userId: string, locked: boolean): Promise<void> {
    return this.uow.run(async () => {
      if (adminId === userId) throw new DomainError('VALIDATION_ERROR', 'Không thể tự khoá chính mình');
      const user = await this.txHost.tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('Không tìm thấy người dùng');
      await this.txHost.tx.user.update({
        where: { id: userId },
        data: { status: locked ? 'LOCKED' : 'ACTIVE' },
      });
      if (locked) await this.sessions.revokeAll(userId);
      await this.audit.log({
        actorId: adminId,
        action: locked ? 'user.lock' : 'user.unlock',
        targetType: 'user',
        targetId: userId,
      });
    });
  }
}
