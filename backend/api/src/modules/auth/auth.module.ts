import { Module } from '@nestjs/common';
import {
  AuthMails,
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
} from './application/auth.use-cases';
import { SessionService } from './domain/session';
import { PasswordHasher, UserAccountRepository } from './domain/user-account';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { GoogleOAuthClient } from './infrastructure/google-oauth.client';
import { JwtSessionService } from './infrastructure/jwt-session.service';
import { PrismaUserAccountRepository } from './infrastructure/prisma-user-account.repository';
import { AuthController, MeController } from './presentation/auth.controller';

@Module({
  controllers: [AuthController, MeController],
  providers: [
    { provide: UserAccountRepository, useClass: PrismaUserAccountRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: SessionService, useClass: JwtSessionService },
    GoogleOAuthClient,
    AuthMails,
    RegisterUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    VerifyEmailUseCase,
    ResendVerifyEmailUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GoogleLoginUseCase,
    GetMeUseCase,
  ],
  exports: [SessionService],
})
export class AuthModule {}
