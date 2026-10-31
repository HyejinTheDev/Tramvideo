import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody, ErrorCode } from '@tram/shared';
import { DomainError } from '../../domain/domain-error';

const STATUS_BY_CODE: Partial<Record<ErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  ACCOUNT_LOCKED: 403,
  NOT_PURCHASED: 403,
  NOT_FOUND: 404,
  VIDEO_NOT_FOUND: 404,
  CATEGORY_NOT_FOUND: 404,
  TOPUP_NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  SLUG_TAKEN: 409,
  ALREADY_PURCHASED: 409,
  CONCURRENT_UPDATE: 409,
  INSUFFICIENT_BALANCE: 422,
  VIDEO_NOT_READY: 422,
  DOWNLOAD_LIMIT_REACHED: 429,
  RATE_LIMITED: 429,
};

/** Đổi mọi lỗi sang chuẩn { error: { code, message } }. */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Error');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let body: ApiErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống, vui lòng thử lại sau' },
    };

    if (exception instanceof DomainError) {
      status = STATUS_BY_CODE[exception.code] ?? 400;
      body = {
        error: { code: exception.code, message: exception.message, details: exception.details },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const code: ErrorCode =
        status === 429
          ? 'RATE_LIMITED'
          : status === 404
            ? 'NOT_FOUND'
            : status === 401
              ? 'UNAUTHORIZED'
              : status === 403
                ? 'FORBIDDEN'
                : status < 500
                  ? 'VALIDATION_ERROR'
                  : 'INTERNAL_ERROR';
      const message =
        status === 429 ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau' : exception.message;
      body = { error: { code, message } };
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json(body);
  }
}
