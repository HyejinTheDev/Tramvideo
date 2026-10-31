import { Injectable } from '@nestjs/common';
import type { Order, Paginated, PaginationQuery } from '@tram/shared';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { StoragePort } from '../../../shared/application/storage.port';
import { OrderRepository } from '../domain/order.repository';

@Injectable()
export class ListMyOrdersUseCase {
  constructor(
    private readonly txHost: TransactionHost,
    private readonly storage: StoragePort,
  ) {}

  async execute(userId: string, q: PaginationQuery): Promise<Paginated<Order>> {
    const db = this.txHost.tx;
    const where = { userId, status: 'COMPLETED' as const };
    const [rows, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { video: true },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.order.count({ where }),
    ]);
    return {
      items: rows.map((o) => ({
        id: o.id,
        videoId: o.videoId,
        videoSlug: o.video.slug,
        videoTitle: o.video.title,
        thumbnailUrl: o.video.thumbnailKey ? this.storage.publicUrl(o.video.thumbnailKey) : null,
        price: o.price,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}

@Injectable()
export class CheckOwnershipQuery {
  constructor(private readonly orders: OrderRepository) {}

  async execute(userId: string, videoId: string) {
    return { owned: await this.orders.owns(userId, videoId) };
  }
}
