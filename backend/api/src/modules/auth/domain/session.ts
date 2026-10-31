import type { Role } from '@tram/shared';

export interface IssuedSession {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface SessionContext {
  userAgent?: string;
  ip?: string;
}

/** Port: cấp và xoay vòng phiên đăng nhập (access JWT + refresh token lưu dạng băm). */
export abstract class SessionService {
  abstract issue(user: { id: string; role: Role }, ctx: SessionContext): Promise<IssuedSession>;
  /** Xoay vòng: thu hồi refresh token cũ, cấp cặp mới. Token bị dùng lại → thu hồi toàn bộ phiên. */
  abstract rotate(refreshToken: string, ctx: SessionContext): Promise<IssuedSession | null>;
  abstract revoke(refreshToken: string): Promise<void>;
  abstract revokeAll(userId: string): Promise<void>;
}
