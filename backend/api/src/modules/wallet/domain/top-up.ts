import type { TopUpStatus } from '@tram/shared';
import { TOPUP_CODE_PREFIX } from '@tram/shared';
import { Money } from '../../../shared/domain/money';
import { DomainError } from '../../../shared/domain/domain-error';

export class TopUpNotFoundError extends DomainError {
  constructor() {
    super('TOPUP_NOT_FOUND', 'Không tìm thấy yêu cầu nạp xu');
  }
}

/** Yêu cầu nạp xu: khách chuyển khoản đúng `code` và `amount` → tự cộng xu. */
export class TopUpRequest {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly code: string,
    readonly amount: Money,
    private _status: TopUpStatus,
    readonly expiresAt: Date,
    private _completedAt: Date | null,
    private _paymentEventId: string | null,
    readonly createdAt: Date,
  ) {}

  get status() {
    return this._status;
  }
  get completedAt() {
    return this._completedAt;
  }
  get paymentEventId() {
    return this._paymentEventId;
  }

  /** Hết hạn hiển thị QR (vẫn nhận tiền nếu khách chuyển muộn). */
  expireIfDue(now: Date): boolean {
    if (this._status === 'PENDING' && this.expiresAt <= now) {
      this._status = 'EXPIRED';
      return true;
    }
    return false;
  }

  /** Khớp được tiền vào nếu chưa hoàn tất (kể cả đã quá hạn QR) và đúng số tiền. */
  canMatch(amount: Money): boolean {
    return this._status !== 'COMPLETED' && this.amount.equals(amount);
  }

  complete(paymentEventId: string, now: Date) {
    this._status = 'COMPLETED';
    this._completedAt = now;
    this._paymentEventId = paymentEventId;
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ I, O, 0, 1 dễ nhầm

export function generateTopUpCode(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return TOPUP_CODE_PREFIX + s;
}

/** Tách mã "TVxxxxxx" từ nội dung chuyển khoản (ngân hàng có thể thêm chữ, đổi hoa/thường). */
export function extractTopUpCode(content: string): string | null {
  const re = new RegExp(`${TOPUP_CODE_PREFIX}[${CODE_ALPHABET}]{6}`, 'i');
  const m = re.exec(content.toUpperCase().replace(/[^A-Z0-9]/g, ' '));
  return m ? m[0].toUpperCase() : null;
}

export abstract class TopUpRepository {
  abstract create(input: {
    userId: string;
    code: string;
    amount: Money;
    expiresAt: Date;
  }): Promise<TopUpRequest>;
  abstract codeExists(code: string): Promise<boolean>;
  abstract findById(id: string): Promise<TopUpRequest | null>;
  abstract findByCode(code: string): Promise<TopUpRequest | null>;
  abstract save(topUp: TopUpRequest): Promise<void>;
  abstract countRecentByUser(userId: string, since: Date): Promise<number>;
}
