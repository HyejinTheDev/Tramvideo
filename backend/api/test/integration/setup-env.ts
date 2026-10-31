// Chạy trước mọi file test integration: trỏ sang DB test riêng (không đụng DB dev).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://tram:tram@localhost:5433/tram_video_test';
process.env.NODE_ENV = 'test';
