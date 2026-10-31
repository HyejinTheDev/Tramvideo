import type { Role } from '@tram/shared';
import { AccountLockedError } from './auth.errors';

export interface UserAccount {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  role: Role;
  status: 'ACTIVE' | 'LOCKED';
  emailVerifiedAt: Date | null;
}

export function assertActive(user: UserAccount) {
  if (user.status === 'LOCKED') throw new AccountLockedError();
}

export type OneTimeTokenType = 'VERIFY_EMAIL' | 'RESET_PASSWORD';

/** Port: kho tài khoản (Prisma ở infrastructure). */
export abstract class UserAccountRepository {
  abstract findById(id: string): Promise<UserAccount | null>;
  abstract findByEmail(email: string): Promise<UserAccount | null>;
  abstract findByOAuth(provider: string, providerAccountId: string): Promise<UserAccount | null>;
  /** Tạo user kèm ví rỗng. */
  abstract create(input: {
    email: string;
    name: string | null;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
  }): Promise<UserAccount>;
  abstract linkOAuth(userId: string, provider: string, providerAccountId: string): Promise<void>;
  abstract setPassword(userId: string, passwordHash: string): Promise<void>;
  abstract markEmailVerified(userId: string, at: Date): Promise<void>;

  abstract saveOneTimeToken(input: {
    userId: string;
    type: OneTimeTokenType;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  /** Lấy và đánh dấu đã dùng (1 lần). Trả null nếu không hợp lệ/hết hạn/đã dùng. */
  abstract consumeOneTimeToken(
    type: OneTimeTokenType,
    tokenHash: string,
    now: Date,
  ): Promise<{ userId: string } | null>;
}

export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(hash: string, plain: string): Promise<boolean>;
}
