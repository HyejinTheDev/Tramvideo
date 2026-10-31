import type { ErrorCode } from '@tram/shared';
import { ApiError } from './apiClient';

/** Mã lỗi từ API → câu tiếng Việt hiển thị cho khách. */
const MESSAGES: Partial<Record<ErrorCode, string>> = {
  UNAUTHORIZED: 'Bạn cần đăng nhập để tiếp tục',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khoá. Vui lòng liên hệ hỗ trợ.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  EMAIL_TAKEN: 'Email này đã được đăng ký',
  VIDEO_NOT_FOUND: 'Video không tồn tại hoặc đã bị gỡ',
  ALREADY_PURCHASED: 'Bạn đã mua video này rồi',
  INSUFFICIENT_BALANCE: 'Số dư xu không đủ, vui lòng nạp thêm',
  CONCURRENT_UPDATE: 'Ví vừa thay đổi, vui lòng thử lại',
  NOT_PURCHASED: 'Bạn cần mua video trước khi tải',
  DOWNLOAD_LIMIT_REACHED: 'Bạn đã hết lượt tải video này hôm nay',
  RATE_LIMITED: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
  INTERNAL_ERROR: 'Có lỗi xảy ra, vui lòng thử lại sau',
};

export function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Lỗi validate / nghiệp vụ chi tiết: dùng message server (đã là tiếng Việt).
    return MESSAGES[error.code] ?? error.message;
  }
  return 'Không kết nối được máy chủ, vui lòng kiểm tra mạng';
}
