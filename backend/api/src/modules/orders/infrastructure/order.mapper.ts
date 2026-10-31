import type { Order as OrderRow } from '@tram/database';
import { Money } from '../../../shared/domain/money';
import { Order } from '../domain/order.entity';

/** Prisma row ↔ Order entity */
export const OrderMapper = {
  toEntity(row: OrderRow): Order {
    return Order.restore(
      row.id,
      row.userId,
      row.videoId,
      Money.vnd(row.price),
      row.status,
      row.refundedAt,
    );
  },

  toRow(order: Order) {
    return {
      id: order.id,
      userId: order.userId,
      videoId: order.videoId,
      price: order.price.amount,
      status: order.status,
      refundedAt: order.refundedAt,
    };
  },
};
