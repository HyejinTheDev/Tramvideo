import type { PaymentEventStatus } from '@tram/shared';
import { DomainError } from '../../../shared/domain/domain-error';

/** Giao dịch tiền vào cần lưu (khớp cấu trúc IncomingTransfer của PaymentPort). */
export interface TransferRecord {
  provider: string;
  providerTxId: string;
  amount: number;
  content: string;
  bankAccount: string | null;
  transferredAt: Date;
  raw: unknown;
}

export class PaymentEvent {
  constructor(
    readonly id: string,
    readonly providerTxId: string,
    readonly amount: number,
    readonly content: string,
    private _status: PaymentEventStatus,
    private _resolvedById: string | null = null,
    private _resolvedAt: Date | null = null,
    private _note: string | null = null,
  ) {}

  get status() {
    return this._status;
  }
  get resolvedById() {
    return this._resolvedById;
  }
  get resolvedAt() {
    return this._resolvedAt;
  }
  get note() {
    return this._note;
  }

  markMatched() {
    this._status = 'MATCHED';
  }

  markUnmatched() {
    this._status = 'UNMATCHED';
  }

  /** Admin xử lý tay khoản UNMATCHED. */
  resolve(adminId: string, now: Date, note: string, outcome: 'RESOLVED' | 'IGNORED') {
    if (this._status !== 'UNMATCHED') {
      throw new DomainError('VALIDATION_ERROR', 'Khoản nạp này không ở trạng thái chờ xử lý');
    }
    this._status = outcome;
    this._resolvedById = adminId;
    this._resolvedAt = now;
    this._note = note;
  }
}

export abstract class PaymentEventRepository {
  /**
   * Lưu event; trùng (provider, providerTxId) → isNew=false (chống cộng tiền 2 lần).
   * Không ném lỗi khi trùng để không làm hỏng transaction.
   */
  abstract record(
    transfer: TransferRecord,
    status: PaymentEventStatus,
  ): Promise<{ event: PaymentEvent; isNew: boolean }>;
  abstract findById(id: string): Promise<PaymentEvent | null>;
  abstract save(event: PaymentEvent): Promise<void>;
}
