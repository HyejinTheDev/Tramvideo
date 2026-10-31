import type { ErrorCode } from '@tram/shared';

/**
 * Lỗi nghiệp vụ có mã. Domain/Application chỉ ném lỗi này,
 * DomainErrorFilter ở Presentation đổi sang HTTP status.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Không tìm thấy') {
    super('NOT_FOUND', message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này') {
    super('FORBIDDEN', message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Bạn cần đăng nhập') {
    super('UNAUTHORIZED', message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
  }
}

/** Ví vừa bị request khác thay đổi (khoá lạc quan). */
export class ConcurrencyError extends DomainError {
  constructor() {
    super('CONCURRENT_UPDATE', 'Dữ liệu vừa thay đổi, vui lòng thử lại');
  }
}
