import type { LedgerType } from '@tram/shared';
import { Money } from '../../../shared/domain/money';

/** Một dòng sổ cái. Không bao giờ sửa/xoá; sai thì ghi thêm dòng điều chỉnh. */
export class LedgerEntry {
  private constructor(
    readonly type: LedgerType,
    /** dương: cộng xu, âm: trừ xu */
    readonly signedAmount: number,
    readonly refType: string | null,
    readonly refId: string | null,
    readonly note: string | null = null,
    readonly createdById: string | null = null,
  ) {}

  static purchase(price: Money, orderId: string) {
    return new LedgerEntry('PURCHASE', -price.amount, 'order', orderId);
  }

  static topUp(amount: Money, topUpId: string | null, paymentEventId?: string) {
    return topUpId
      ? new LedgerEntry('TOPUP', amount.amount, 'topup', topUpId)
      : new LedgerEntry('TOPUP', amount.amount, 'payment', paymentEventId ?? null);
  }

  static refund(amount: Money, orderId: string, adminId: string, note: string) {
    return new LedgerEntry('REFUND', amount.amount, 'order', orderId, note, adminId);
  }

  static adjustment(signedAmount: number, adminId: string, note: string) {
    return new LedgerEntry('ADJUSTMENT', signedAmount, 'admin', null, note, adminId);
  }

  static manualTopUp(amount: Money, paymentEventId: string, adminId: string, note: string) {
    return new LedgerEntry('TOPUP', amount.amount, 'payment', paymentEventId, note, adminId);
  }
}
