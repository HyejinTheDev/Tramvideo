import { Injectable } from '@nestjs/common';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import type { Order } from '../domain/order.entity';
import { OrderRepository } from '../domain/order.repository';
import { OrderMapper } from './order.mapper';

@Injectable()
export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  async findById(id: string) {
    const row = await this.txHost.tx.order.findUnique({ where: { id } });
    return row ? OrderMapper.toEntity(row) : null;
  }

  async findByUserAndVideo(userId: string, videoId: string) {
    const row = await this.txHost.tx.order.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    return row ? OrderMapper.toEntity(row) : null;
  }

  async owns(userId: string, videoId: string) {
    const n = await this.txHost.tx.order.count({
      where: { userId, videoId, status: 'COMPLETED' },
    });
    return n > 0;
  }

  async save(order: Order) {
    const data = OrderMapper.toRow(order);
    if (order.isNew) {
      await this.txHost.tx.order.create({ data });
    } else {
      await this.txHost.tx.order.update({ where: { id: order.id }, data });
    }
  }
}
