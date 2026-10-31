import { DomainError } from '../../../shared/domain/domain-error';
import { Money } from '../../../shared/domain/money';

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super('INSUFFICIENT_BALANCE', 'Số dư xu không đủ');
  }
}

/**
 * Ví xu của người dùng. `version` dùng cho khoá lạc quan:
 * repository chỉ ghi được khi version trong DB vẫn bằng version lúc đọc.
 */
export class Wallet {
  constructor(
    readonly id: string,
    readonly userId: string,
    private _balance: Money,
    readonly version: number,
  ) {}

  get balance(): Money {
    return this._balance;
  }

  debit(amount: Money) {
    if (this._balance.lessThan(amount)) throw new InsufficientBalanceError();
    this._balance = this._balance.subtract(amount);
  }

  credit(amount: Money) {
    this._balance = this._balance.add(amount);
  }
}
