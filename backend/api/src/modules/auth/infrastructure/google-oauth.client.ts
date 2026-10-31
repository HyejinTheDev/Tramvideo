import { Injectable } from '@nestjs/common';
import { env } from '../../../config/env';
import { DomainError } from '../../../shared/domain/domain-error';

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/** Đăng nhập Google theo OAuth 2.0 Authorization Code (gọi HTTP trực tiếp, không cần passport). */
@Injectable()
export class GoogleOAuthClient {
  get enabled() {
    return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  private get redirectUri() {
    return `${env.APP_API_URL}/v1/auth/google/callback`;
  }

  authUrl(state: string): string {
    this.ensureEnabled();
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchange(code: string): Promise<GoogleProfile> {
    this.ensureEnabled();
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new DomainError('UNAUTHORIZED', 'Đăng nhập Google thất bại');
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) throw new DomainError('UNAUTHORIZED', 'Không đọc được thông tin Google');
    const info = (await infoRes.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
    };
    return {
      sub: info.sub,
      email: info.email.toLowerCase(),
      emailVerified: !!info.email_verified,
      name: info.name ?? null,
    };
  }

  private ensureEnabled() {
    if (!this.enabled) throw new DomainError('NOT_FOUND', 'Đăng nhập Google chưa được bật');
  }
}
