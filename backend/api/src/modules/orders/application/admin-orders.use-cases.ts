import { Injectable } from '@nestjs/common';
import type { AdminOrder, AdminOrdersQuery, Paginated, RefundOrderInput } from '@tram/shared';
import { ClockPort } from '../../../shared/application/clock.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { AuditLogger } from '../../audit/application/audit-logger';
import { VideoRepository } from '../../videos/domain/video.repository';
import { LedgerEntry } from '../../wallet/domain/ledger-entry';
import { WalletRepository } from '../../wallet/domain/wallet.repository';
import { OrderNotFoundError } from '../domain/order.errors';
import { OrderRepository } from '../domain/order.repository';

@Injectable()
export class ListAllOrdersQuery {
  constructor(private readonly txHost: TransactionHost) {}

  async execute(q: AdminOrdersQuery): Promise<Paginated<AdminOrder>> {
    const db = this.txHost.tx;
    const where = q.status ? { status: q.status } : {};
    const [rows, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { user: { select: { email: true } }, video: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.order.count({ where }),
    ]);
    return {
      items: rows.map((o) => ({
        id: o.id,
        userEmail: o.user.email,
        videoTitle: o.video.title,
        price: o.price,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        refundedAt: o.refundedAt?.toISOString() ?? null,
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}

/** Hoàn xu cho 1 đơn: cộng lại đúng giá đã trả, ghi sổ cái REFUND, ghi AuditLog. */
@Injectable()
export class RefundOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly wallets: WalletRepository,
    private readonly videos: VideoRepository,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(adminId: string, orderId: string, input: RefundOrderInput): Promise<void> {
    return this.uow.run(async () => {
      const order = await this.orders.findById(orderId);
      if (!order) throw new OrderNotFoundError();
      order.refund(this.clock.now());

      const wallet = await this.wallets.findByUserId(order.userId);
      wallet.credit(order.price);

      await this.orders.save(order);
      await this.wallets.save(wallet, LedgerEntry.refund(order.price, order.id, adminId, input.note));
      await this.videos.incrementPurchaseCount(order.videoId, -1);
      await this.audit.log({
        actorId: adminId,
        action: 'order.refund',
        targetType: 'order',
        targetId: order.id,
        data: { amount: order.price.amount, note: input.note },
      });
    });
  }
}
