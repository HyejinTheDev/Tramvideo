import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@tram/shared';
import { env } from '../../../config/env';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { IssuedSession, SessionContext, SessionService } from '../domain/session';
import { randomToken, sha256 } from './crypto';

const ACCESS_TTL_SEC = 15 * 60; // 15 phút
const REFRESH_TTL_SEC = 30 * 24 * 3600; // 30 ngày

@Injectable()
export class JwtSessionService extends SessionService {
  private readonly logger = new Logger(JwtSessionService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly txHost: TransactionHost,
  ) {
    super();
  }

  async issue(user: { id: string; role: Role }, ctx: SessionContext): Promise<IssuedSession> {
    const now = Date.now();
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: ACCESS_TTL_SEC },
    );
    const refreshToken = randomToken(48);
    const refreshExpiresAt = new Date(now + REFRESH_TTL_SEC * 1000);
    await this.txHost.tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: refreshExpiresAt,
        userAgent: ctx.userAgent?.slice(0, 300),
        ip: ctx.ip,
      },
    });
    return {
      accessToken,
      accessExpiresAt: new Date(now + ACCESS_TTL_SEC * 1000),
      refreshToken,
      refreshExpiresAt,
    };
  }

  async rotate(refreshToken: string, ctx: SessionContext): Promise<IssuedSession | null> {
    const db = this.txHost.tx;
    const row = await db.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!row) return null;

    if (row.revokedAt) {
      // Token đã thu hồi mà bị dùng lại → có thể bị đánh cắp → thu hồi mọi phiên của user.
      this.logger.warn(`Refresh token bị dùng lại, thu hồi toàn bộ phiên của user ${row.userId}`);
      await this.revokeAll(row.userId);
      return null;
    }
    if (row.expiresAt < new Date() || row.user.status === 'LOCKED') return null;

    const { count } = await db.refreshToken.updateMany({
      where: { id: row.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) return null; // request song song đã xoay vòng trước
    return this.issue({ id: row.user.id, role: row.user.role }, ctx);
  }

  async revoke(refreshToken: string) {
    await this.txHost.tx.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string) {
    await this.txHost.tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
