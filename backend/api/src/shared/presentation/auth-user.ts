import type { Role } from '@tram/shared';

/** Người dùng đã xác thực, gắn vào request bởi JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: Role;
}

export const ACCESS_COOKIE = 'tv_at';
export const REFRESH_COOKIE = 'tv_rt';
