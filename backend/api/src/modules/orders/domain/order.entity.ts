import { randomUUID } from 'node:crypto';
import type { OrderStatus } from '@tram/shared';
import { Entity } from '../../../shared/domain/entity';
import { Money } from '../../../shared/domain/money';
import { AlreadyPurchasedError, OrderNotRefundableError } from './order.errors';

export class Order extends Entity {
  private constructor(
    id: string,
    readonly userId: string,
    readonly videoId: string,
    private _price: Money,
    private _status: OrderStatus,
    private _refundedAt: Date | null,
    readonly isNew: boolean,
  ) {
    super(id);
  }

  static create(input: { userId: string; videoId: string; price: Money }): Order {
    return new Order(randomUUID(), input.userId, input.videoId, input.price, 'COMPLETED', null, true);
  }

  static restore(
    id: string,
    userId: string,
    videoId: string,
    price: Money,
    status: OrderStatus,
    refundedAt: Date | null,
  ): Order {
    return new Order(id, userId, videoId, price, status, refundedAt, false);
  }

  get price() {
    return this._price;
  }
  get status() {
    return this._status;
  }
  get refundedAt() {
    return this._refundedAt;
  }

  /** Đơn đã hoàn xu → khách được mua lại (giá hiện tại). */
  repurchase(price: Money) {
    if (this._status === 'COMPLETED') throw new AlreadyPurchasedError();
    this._price = price;
    this._status = 'COMPLETED';
    this._refundedAt = null;
  }

  refund(now: Date) {
    if (this._status !== 'COMPLETED') throw new OrderNotRefundableError();
    this._status = 'REFUNDED';
    this._refundedAt = now;
  }
}
