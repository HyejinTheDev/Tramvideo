/**
 * Dữ liệu mẫu cho môi trường dev. Chạy: pnpm db:seed
 * Tài khoản:
 *   admin@tramvideo.local / Admin@12345  (ADMIN)
 *   khach@tramvideo.local / Khach@12345  (USER, ví 100.000 xu)
 */
import { PrismaClient, LedgerType, VideoStatus } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function upsertUser(email: string, password: string, role: 'USER' | 'ADMIN', name: string) {
  const passwordHash = await hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash, emailVerifiedAt: new Date() },
  });
  await prisma.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  return user;
}

async function main() {
  const categories = [
    { name: 'Tổng tài', slug: 'tong-tai', sortOrder: 1 },
    { name: 'Quay xe', slug: 'quay-xe', sortOrder: 2 },
    { name: 'Meme hài', slug: 'meme-hai', sortOrder: 3 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  await upsertUser('admin@tramvideo.local', 'Admin@12345', 'ADMIN', 'Quản trị');
  const khach = await upsertUser('khach@tramvideo.local', 'Khach@12345', 'USER', 'Khách thử');

  // Nạp sẵn 100.000 xu cho khách thử (chỉ khi ví đang trống)
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: khach.id } });
  if (wallet.balance === 0) {
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: 100_000, version: { increment: 1 } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: LedgerType.ADJUSTMENT,
          amount: 100_000,
          balanceAfter: 100_000,
          refType: 'admin',
          note: 'Xu thử nghiệm (seed)',
        },
      }),
    ]);
  }

  const cats = await prisma.category.findMany();
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  const samples = [
    ['Tổng tài lạnh lùng gặp cô nàng bướng bỉnh', 'tong-tai', 15000, 92],
    ['Tổng tài quỳ gối xin lỗi giữa mưa', 'tong-tai', 20000, 120],
    ['Màn quay xe đỉnh cao ngày cưới', 'quay-xe', 12000, 65],
    ['Quay xe 180 độ khi biết sự thật', 'quay-xe', 10000, 48],
    ['Meme mèo nhảy theo nhạc Tết', 'meme-hai', 5000, 30],
    ['Meme chó Shiba ngơ ngác', 'meme-hai', 5000, 22],
  ] as const;

  for (const [title, cat, price, durationSec] of samples) {
    const slug = title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    await prisma.video.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        price,
        durationSec,
        description: `Video mẫu: ${title}.`,
        categoryId: bySlug[cat]!,
        status: VideoStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: [cat],
        fileKey: `originals/sample/${slug}.mp4`,
      },
    });
  }

  console.log('Seed xong.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
