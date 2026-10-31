import { Injectable } from '@nestjs/common';
import type { Stats, StatsQuery } from '@tram/shared';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';

/** Read model thống kê cho dashboard admin. Mặc định: hôm nay (giờ VN). */
@Injectable()
export class StatsQueryService {
  constructor(private readonly txHost: TransactionHost) {}

  private todayVn(): { from: Date; to: Date } {
    const offset = 7 * 3600 * 1000;
    const nowVn = new Date(Date.now() + offset);
    const startVn = Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate());
    return { from: new Date(startVn - offset), to: new Date(startVn - offset + 24 * 3600 * 1000) };
  }

  async execute(q: StatsQuery): Promise<Stats> {
    const def = this.todayVn();
    const from = q.from ?? def.from;
    const to = q.to ?? def.to;
    const range = { gte: from, lt: to };
    const db = this.txHost.tx;

    const [orders, topUps, newUsers, unmatched, top] = await Promise.all([
      db.order.aggregate({
        where: { createdAt: range, status: 'COMPLETED' },
        _sum: { price: true },
        _count: true,
      }),
      db.topUpRequest.aggregate({
        where: { completedAt: range, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      db.user.count({ where: { createdAt: range } }),
      db.paymentEvent.count({ where: { status: 'UNMATCHED' } }),
      db.order.groupBy({
        by: ['videoId'],
        where: { createdAt: range, status: 'COMPLETED' },
        _count: true,
        _sum: { price: true },
        orderBy: { _count: { videoId: 'desc' } },
        take: 5,
      }),
    ]);

    const titles = await db.video.findMany({
      where: { id: { in: top.map((t) => t.videoId) } },
      select: { id: true, title: true },
    });
    const titleById = new Map(titles.map((t) => [t.id, t.title]));

    return {
      revenue: orders._sum.price ?? 0,
      orderCount: orders._count,
      topUpAmount: topUps._sum.amount ?? 0,
      topUpCount: topUps._count,
      newUsers,
      unmatchedPayments: unmatched,
      topVideos: top.map((t) => ({
        id: t.videoId,
        title: titleById.get(t.videoId) ?? '(đã xoá)',
        sold: t._count,
        revenue: t._sum.price ?? 0,
      })),
    };
  }
}
