import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Role } from '@tram/shared';
import { env } from '../../../config/env';
import { UnauthorizedError } from '../../domain/domain-error';
import { ACCESS_COOKIE, AuthUser } from '../auth-user';
import { IS_PUBLIC } from '../decorators';

/**
 * Guard toàn cục: mọi endpoint mặc định cần đăng nhập, trừ khi gắn @Public().
 * Access token đọc từ cookie httpOnly.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(token, {
          secret: env.JWT_ACCESS_SECRET,
        });
        req.user = { id: payload.sub, role: payload.role };
      } catch {
        if (!isPublic) throw new UnauthorizedError('Phiên đăng nhập đã hết hạn');
      }
    }

    if (!isPublic && !req.user) throw new UnauthorizedError();
    return true;
  }
}
