import type { Order } from './order.entity';

export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findByUserAndVideo(userId: string, videoId: string): Promise<Order | null>;
  /** Có đơn COMPLETED (đang sở hữu video). */
  abstract owns(userId: string, videoId: string): Promise<boolean>;
  abstract save(order: Order): Promise<void>;
}
