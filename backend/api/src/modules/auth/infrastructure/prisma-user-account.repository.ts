import { Injectable } from '@nestjs/common';
import type { User } from '@tram/database';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { OneTimeTokenType, UserAccount, UserAccountRepository } from '../domain/user-account';

function toAccount(u: User): UserAccount {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: u.passwordHash,
    role: u.role,
    status: u.status,
    emailVerifiedAt: u.emailVerifiedAt,
  };
}

@Injectable()
export class PrismaUserAccountRepository extends UserAccountRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  private get db() {
    return this.txHost.tx;
  }

  async findById(id: string) {
    const u = await this.db.user.findUnique({ where: { id } });
    return u ? toAccount(u) : null;
  }

  async findByEmail(email: string) {
    const u = await this.db.user.findUnique({ where: { email: email.toLowerCase() } });
    return u ? toAccount(u) : null;
  }

  async findByOAuth(provider: string, providerAccountId: string) {
    const acc = await this.db.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
    return acc ? toAccount(acc.user) : null;
  }

  async create(input: {
    email: string;
    name: string | null;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
  }) {
    const u = await this.db.user.create({
      data: { ...input, email: input.email.toLowerCase(), wallet: { create: {} } },
    });
    return toAccount(u);
  }

  async linkOAuth(userId: string, provider: string, providerAccountId: string) {
    await this.db.oAuthAccount.create({ data: { userId, provider, providerAccountId } });
  }

  async setPassword(userId: string, passwordHash: string) {
    await this.db.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async markEmailVerified(userId: string, at: Date) {
    await this.db.user.update({ where: { id: userId }, data: { emailVerifiedAt: at } });
  }

  async saveOneTimeToken(input: {
    userId: string;
    type: OneTimeTokenType;
    tokenHash: string;
    expiresAt: Date;
  }) {
    // Mỗi user chỉ giữ 1 token còn hiệu lực cho mỗi loại.
    await this.db.authToken.updateMany({
      where: { userId: input.userId, type: input.type, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.db.authToken.create({ data: input });
  }

  async consumeOneTimeToken(type: OneTimeTokenType, tokenHash: string, now: Date) {
    const t = await this.db.authToken.findUnique({ where: { tokenHash } });
    if (!t || t.type !== type || t.usedAt || t.expiresAt < now) return null;
    // updateMany có điều kiện usedAt=null → chống dùng 2 lần đồng thời.
    const { count } = await this.db.authToken.updateMany({
      where: { id: t.id, usedAt: null },
      data: { usedAt: now },
    });
    return count === 1 ? { userId: t.userId } : null;
  }
}
