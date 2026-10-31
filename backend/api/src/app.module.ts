import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { env, isProd } from './config/env';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { HealthController } from './modules/health/health.controller';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShareModule } from './modules/share/share.module';
import { StatsModule } from './modules/stats/stats.module';
import { UsersModule } from './modules/users/users.module';
import { VideosModule } from './modules/videos/videos.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { DevStorageController } from './shared/infrastructure/storage/dev-storage.controller';
import { DomainErrorFilter } from './shared/presentation/filters/domain-error.filter';
import { JwtAuthGuard } from './shared/presentation/guards/jwt-auth.guard';
import { RolesGuard } from './shared/presentation/guards/roles.guard';
import { ResponseInterceptor } from './shared/presentation/interceptors/response.interceptor';

const r2Configured = !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        transport: isProd ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
        // Không log cookie/token/mật khẩu.
        redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
        autoLogging: { ignore: (req) => req.url === '/health' },
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({ global: true, secret: env.JWT_ACCESS_SECRET }),
    InfrastructureModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    VideosModule,
    WalletModule,
    PaymentsModule,
    OrdersModule,
    DownloadsModule,
    ShareModule,
    StatsModule,
  ],
  controllers: [HealthController, ...(!isProd && !r2Configured ? [DevStorageController] : [])],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
