import { DomainError } from './domain-error';

export class InvalidMoneyError extends DomainError {
  constructor(amount: number) {
    super('VALIDATION_ERROR', `Số tiền không hợp lệ: ${amount}`);
  }
}

/** Value object tiền VND (= xu): số nguyên, không âm, bất biến. */
export class Money {
  private constructor(readonly amount: number) {}

  static vnd(amount: number): Money {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new InvalidMoneyError(amount);
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  lessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  add(other: Money): Money {
    return Money.vnd(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.vnd(this.amount - other.amount);
  }
}
