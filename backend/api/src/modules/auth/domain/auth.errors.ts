import { DomainError } from '../../../shared/domain/domain-error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  }
}

export class EmailTakenError extends DomainError {
  constructor() {
    super('EMAIL_TAKEN', 'Email đã được đăng ký');
  }
}

export class AccountLockedError extends DomainError {
  constructor() {
    super('ACCOUNT_LOCKED', 'Tài khoản đã bị khoá. Vui lòng liên hệ hỗ trợ.');
  }
}

export class InvalidTokenError extends DomainError {
  constructor(message = 'Liên kết không hợp lệ hoặc đã hết hạn') {
    super('VALIDATION_ERROR', message);
  }
}
