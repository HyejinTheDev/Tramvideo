import { Injectable } from '@nestjs/common';
import type {
  ForgotPasswordInput,
  LoginInput,
  Me,
  RegisterInput,
  ResetPasswordInput,
} from '@tram/shared';
import { env } from '../../../config/env';
import { ClockPort } from '../../../shared/application/clock.port';
import { MailerPort } from '../../../shared/application/mailer.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { UnauthorizedError } from '../../../shared/domain/domain-error';
import {
  EmailTakenError,
  InvalidCredentialsError,
  InvalidTokenError,
} from '../domain/auth.errors';
import { IssuedSession, SessionContext, SessionService } from '../domain/session';
import {
  assertActive,
  PasswordHasher,
  UserAccount,
  UserAccountRepository,
} from '../domain/user-account';
import type { GoogleProfile } from '../infrastructure/google-oauth.client';
import { randomToken, sha256 } from '../infrastructure/crypto';

const VERIFY_TTL_MS = 24 * 3600 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

export function toMe(u: UserAccount): Me {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: !!u.emailVerifiedAt,
  };
}

/** Gửi mail xác thực / đặt lại mật khẩu (token 1 lần, lưu dạng băm). */
@Injectable()
export class AuthMails {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly mailer: MailerPort,
    private readonly clock: ClockPort,
  ) {}

  async sendVerify(user: UserAccount) {
    const token = randomToken();
    await this.users.saveOneTimeToken({
      userId: user.id,
      type: 'VERIFY_EMAIL',
      tokenHash: sha256(token),
      expiresAt: new Date(this.clock.now().getTime() + VERIFY_TTL_MS),
    });
    const link = `${env.APP_WEB_URL}/xac-thuc-email?token=${token}`;
    await this.mailer.send({
      to: user.email,
      subject: 'Xác thực email – Trạm Video',
      html: `<p>Chào ${user.name ?? 'bạn'},</p><p>Bấm vào liên kết sau để xác thực email (hiệu lực 24 giờ):</p><p><a href="${link}">${link}</a></p>`,
    });
  }

  async sendReset(user: UserAccount) {
    const token = randomToken();
    await this.users.saveOneTimeToken({
      userId: user.id,
      type: 'RESET_PASSWORD',
      tokenHash: sha256(token),
      expiresAt: new Date(this.clock.now().getTime() + RESET_TTL_MS),
    });
    const link = `${env.APP_WEB_URL}/dat-lai-mat-khau?token=${token}`;
    await this.mailer.send({
      to: user.email,
      subject: 'Đặt lại mật khẩu – Trạm Video',
      html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực 30 phút:</p><p><a href="${link}">${link}</a></p><p>Nếu không phải bạn, hãy bỏ qua email này.</p>`,
    });
  }
}

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
    private readonly mails: AuthMails,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: RegisterInput, ctx: SessionContext) {
    const passwordHash = await this.hasher.hash(input.password);
    const { user, session } = await this.uow.run(async () => {
      if (await this.users.findByEmail(input.email)) throw new EmailTakenError();
      const user = await this.users.create({
        email: input.email,
        name: input.name ?? null,
        passwordHash,
        emailVerifiedAt: null,
      });
      const session = await this.sessions.issue(user, ctx);
      await this.mails.sendVerify(user);
      return { user, session };
    });
    return { me: toMe(user), session };
  }
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
  ) {}

  async execute(input: LoginInput, ctx: SessionContext) {
    const user = await this.users.findByEmail(input.email);
    if (!user?.passwordHash || !(await this.hasher.verify(user.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }
    assertActive(user);
    const session = await this.sessions.issue(user, ctx);
    return { me: toMe(user), session };
  }
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: SessionService,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(refreshToken: string | undefined, ctx: SessionContext): Promise<IssuedSession> {
    if (!refreshToken) throw new UnauthorizedError();
    const session = await this.uow.run(() => this.sessions.rotate(refreshToken, ctx));
    if (!session) throw new UnauthorizedError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    return session;
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessions: SessionService) {}

  async execute(refreshToken: string | undefined) {
    if (refreshToken) await this.sessions.revoke(refreshToken);
  }
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
  ) {}

  execute(token: string) {
    return this.uow.run(async () => {
      const now = this.clock.now();
      const res = await this.users.consumeOneTimeToken('VERIFY_EMAIL', sha256(token), now);
      if (!res) throw new InvalidTokenError();
      await this.users.markEmailVerified(res.userId, now);
    });
  }
}

@Injectable()
export class ResendVerifyEmailUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly mails: AuthMails,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || user.emailVerifiedAt) return;
    await this.mails.sendVerify(user);
  }
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly mails: AuthMails,
  ) {}

  /** Luôn trả thành công để không lộ email nào đã đăng ký. */
  async execute(input: ForgotPasswordInput) {
    const user = await this.users.findByEmail(input.email);
    if (user && user.status === 'ACTIVE') await this.mails.sendReset(user);
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: ResetPasswordInput) {
    const passwordHash = await this.hasher.hash(input.password);
    await this.uow.run(async () => {
      const now = this.clock.now();
      const res = await this.users.consumeOneTimeToken('RESET_PASSWORD', sha256(input.token), now);
      if (!res) throw new InvalidTokenError();
      await this.users.setPassword(res.userId, passwordHash);
      // Đã nhận được mail → email coi như đã xác thực.
      await this.users.markEmailVerified(res.userId, now);
      await this.sessions.revokeAll(res.userId); // đăng xuất mọi thiết bị
    });
  }
}

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly sessions: SessionService,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
  ) {}

  execute(profile: GoogleProfile, ctx: SessionContext) {
    return this.uow.run(async () => {
      let user = await this.users.findByOAuth('google', profile.sub);
      if (!user) {
        if (!profile.emailVerified) throw new UnauthorizedError('Email Google chưa được xác thực');
        user = await this.users.findByEmail(profile.email);
        if (!user) {
          user = await this.users.create({
            email: profile.email,
            name: profile.name,
            passwordHash: null,
            emailVerifiedAt: this.clock.now(),
          });
        } else if (!user.emailVerifiedAt) {
          await this.users.markEmailVerified(user.id, this.clock.now());
        }
        await this.users.linkOAuth(user.id, 'google', profile.sub);
      }
      assertActive(user);
      return this.sessions.issue(user, ctx);
    });
  }
}

@Injectable()
export class GetMeUseCase {
  constructor(private readonly users: UserAccountRepository) {}

  async execute(userId: string): Promise<Me> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    assertActive(user);
    return toMe(user);
  }
}
