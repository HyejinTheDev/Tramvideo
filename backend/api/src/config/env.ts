import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// .env nằm ở gốc monorepo; trên server dùng biến môi trường của Docker.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const optional = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  APP_WEB_URL: z.string().url(),
  APP_ADMIN_URL: z.string().url(),
  APP_API_URL: z.string().url(),
  COOKIE_DOMAIN: z.string().min(1),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET_PRIVATE: z.string().default('tram-video-private'),
  R2_BUCKET_PUBLIC: z.string().default('tram-video-public'),
  R2_PUBLIC_BASE_URL: z.string().url(),

  SEPAY_WEBHOOK_API_KEY: z.string().min(8),
  BANK_CODE: z.string().default('MB'),
  BANK_ACCOUNT_NO: z.string().default(''),
  BANK_ACCOUNT_NAME: z.string().default(''),

  RESEND_API_KEY: optional,
  MAIL_FROM: z.string().default('Trạm Video <no-reply@tramvideo.vn>'),
  SENTRY_DSN: optional,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Thiếu/sai biến → dừng ngay, không chạy với cấu hình sai.
    console.error('❌ Biến môi trường không hợp lệ:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProd = env.NODE_ENV === 'production';
