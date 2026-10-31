import { DomainError } from '../../../shared/domain/domain-error';

export class AlreadyPurchasedError extends DomainError {
  constructor() {
    super('ALREADY_PURCHASED', 'Bạn đã mua video này rồi');
  }
}

export class OrderNotFoundError extends DomainError {
  constructor() {
    super('NOT_FOUND', 'Không tìm thấy đơn hàng');
  }
}

export class OrderNotRefundableError extends DomainError {
  constructor() {
    super('VALIDATION_ERROR', 'Đơn hàng đã được hoàn xu trước đó');
  }
}
