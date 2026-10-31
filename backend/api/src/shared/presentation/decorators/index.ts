import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { Role } from '@tram/shared';
import type { AuthUser } from '../auth-user';

export const IS_PUBLIC = 'isPublic';
/** Endpoint không cần đăng nhập (vẫn đọc user nếu có cookie). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Lấy người dùng hiện tại. Trên endpoint @Public có thể là undefined. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>().user,
);

/** IP thật của client (sau Caddy/Cloudflare). */
export const ClientIp = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string') return cf;
  return req.ip ?? '0.0.0.0';
});

export const UserAgent = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined =>
    ctx.switchToHttp().getRequest<Request>().headers['user-agent'],
);
