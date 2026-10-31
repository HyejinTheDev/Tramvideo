import 'reflect-metadata';
import { env } from './config/env';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { originGuard } from './shared/presentation/origin-guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Sau Caddy/Cloudflare → tin header X-Forwarded-For để lấy IP thật.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [env.APP_WEB_URL, env.APP_ADMIN_URL],
    credentials: true,
  });
  app.use(originGuard([env.APP_WEB_URL, env.APP_ADMIN_URL]));

  app.setGlobalPrefix('v1', { exclude: ['health', 'dev-upload/(.*)', 'dev-download/(.*)'] });
  app.enableShutdownHooks();

  await app.listen(env.PORT);
}

void bootstrap();
