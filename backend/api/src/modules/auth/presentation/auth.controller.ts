import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@tram/shared';
import { env, isProd } from '../../../config/env';
import { ACCESS_COOKIE, REFRESH_COOKIE, type AuthUser } from '../../../shared/presentation/auth-user';
import { ClientIp, CurrentUser, Public, UserAgent } from '../../../shared/presentation/decorators';
import { RawResponse, ZodBody } from '../../../shared/presentation/pipes/zod-validation.pipe';
import {
  ForgotPasswordUseCase,
  GetMeUseCase,
  GoogleLoginUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  RegisterUseCase,
  ResendVerifyEmailUseCase,
  ResetPasswordUseCase,
  VerifyEmailUseCase,
} from '../application/auth.use-cases';
import type { IssuedSession } from '../domain/session';
import { randomToken } from '../infrastructure/crypto';
import { GoogleOAuthClient } from '../infrastructure/google-oauth.client';

const OAUTH_STATE_COOKIE = 'tv_oauth_state';

function baseCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    // localhost không đặt domain (trình duyệt từ chối Domain=localhost ở một số bản).
    ...(env.COOKIE_DOMAIN !== 'localhost' && { domain: env.COOKIE_DOMAIN }),
  };
}

function setSessionCookies(res: Response, s: IssuedSession) {
  res.cookie(ACCESS_COOKIE, s.accessToken, { ...baseCookie(), path: '/', expires: s.accessExpiresAt });
  res.cookie(REFRESH_COOKIE, s.refreshToken, {
    ...baseCookie(),
    path: '/v1/auth',
    expires: s.refreshExpiresAt,
  });
}

function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: '/v1/auth' });
}

const readCookie = (req: Request, name: string) =>
  (req.cookies as Record<string, string | undefined>)[name];

@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshSessionUseCase,
    private readonly logout: LogoutUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly resendVerify: ResendVerifyEmailUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly googleLogin: GoogleLoginUseCase,
    private readonly google: GoogleOAuthClient,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async doRegister(
    @ZodBody(registerSchema) body: RegisterInput,
    @UserAgent() userAgent: string | undefined,
    @ClientIp() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { me, session } = await this.register.execute(body, { userAgent, ip });
    setSessionCookies(res, session);
    return me;
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async doLogin(
    @ZodBody(loginSchema) body: LoginInput,
    @UserAgent() userAgent: string | undefined,
    @ClientIp() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { me, session } = await this.login.execute(body, { userAgent, ip });
    setSessionCookies(res, session);
    return me;
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async doRefresh(
    @Req() req: Request,
    @UserAgent() userAgent: string | undefined,
    @ClientIp() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const session = await this.refresh.execute(readCookie(req, REFRESH_COOKIE), { userAgent, ip });
      setSessionCookies(res, session);
      return { ok: true };
    } catch (e) {
      clearSessionCookies(res);
      throw e;
    }
  }

  @Post('logout')
  @Public()
  @HttpCode(200)
  async doLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.logout.execute(readCookie(req, REFRESH_COOKIE));
    clearSessionCookies(res);
    return { ok: true };
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  async doVerifyEmail(@ZodBody(verifyEmailSchema) body: VerifyEmailInput) {
    await this.verifyEmail.execute(body.token);
    return { ok: true };
  }

  @Post('resend-verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  async doResendVerify(@CurrentUser() user: AuthUser) {
    await this.resendVerify.execute(user.id);
    return { ok: true };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  async doForgotPassword(@ZodBody(forgotPasswordSchema) body: ForgotPasswordInput) {
    await this.forgotPassword.execute(body);
    return { ok: true };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  async doResetPassword(@ZodBody(resetPasswordSchema) body: ResetPasswordInput) {
    await this.resetPassword.execute(body);
    return { ok: true };
  }

  @Get('google')
  @Public()
  @RawResponse()
  startGoogle(@Res() res: Response) {
    const state = randomToken(16);
    res.cookie(OAUTH_STATE_COOKIE, state, {
      ...baseCookie(),
      path: '/v1/auth/google',
      maxAge: 10 * 60_000,
    });
    res.redirect(this.google.authUrl(state));
  }

  @Get('google/callback')
  @Public()
  @RawResponse()
  async googleCallback(
    @Req() req: Request,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @UserAgent() userAgent: string | undefined,
    @ClientIp() ip: string,
    @Res() res: Response,
  ) {
    const expected = readCookie(req, OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_STATE_COOKIE, { ...baseCookie(), path: '/v1/auth/google' });
    try {
      if (!code || !state || state !== expected) throw new Error('state không khớp');
      const profile = await this.google.exchange(code);
      const session = await this.googleLogin.execute(profile, { userAgent, ip });
      setSessionCookies(res, session);
      res.redirect(env.APP_WEB_URL);
    } catch {
      res.redirect(`${env.APP_WEB_URL}/dang-nhap?loi=google`);
    }
  }
}

@Controller('me')
export class MeController {
  constructor(private readonly getMe: GetMeUseCase) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.getMe.execute(user.id);
  }
}
