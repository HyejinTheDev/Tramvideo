// Áp schema cho DB test (không xoá dữ liệu; test tự tạo dữ liệu riêng mỗi lần chạy).
const { execSync } = require('node:child_process');
const path = require('node:path');

module.exports = async () => {
  const url =
    process.env.TEST_DATABASE_URL ?? 'postgresql://tram:tram@localhost:5433/tram_video_test';
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../../database'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
};
