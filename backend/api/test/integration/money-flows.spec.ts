/**
 * Test với Postgres thật: transaction + khoá version + ràng buộc unique.
 * Chạy: pnpm --filter @tram/api test:int  (cần `docker compose up -d`)
 */
import { ClockPort, SystemClock } from '../../src/shared/application/clock.port';
import { PaymentPort } from '../../src/shared/application/payment.port';
import { StoragePort } from '../../src/shared/application/storage.port';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';
import { PrismaUnitOfWork, TransactionHost } from '../../src/shared/infrastructure/prisma/transaction-host';
import { SepayAdapter } from '../../src/shared/infrastructure/payment/sepay.adapter';
import { PrismaVideoRepository } from '../../src/modules/videos/infrastructure/prisma-video.repository';
import { PrismaWalletRepository } from '../../src/modules/wallet/infrastructure/prisma-wallet.repository';
import { PrismaTopUpRepository } from '../../src/modules/wallet/infrastructure/prisma-top-up.repository';
import { PrismaOrderRepository } from '../../src/modules/orders/infrastructure/prisma-order.repository';
import { PrismaPaymentEventRepository } from '../../src/modules/payments/infrastructure/prisma-payment-event.repository';
import { PrismaDownloadLogRepository } from '../../src/modules/downloads/infrastructure/prisma-download-log.repository';
import { PurchaseVideoUseCase } from '../../src/modules/orders/application/purchase-video.use-case';
import { HandlePaymentWebhookUseCase } from '../../src/modules/payments/application/payments.use-cases';
import { IssueDownloadLinkUseCase } from '../../src/modules/downloads/application/issue-download-link.use-case';
import { env } from '../../src/config/env';

const prisma = new PrismaService();
const txHost = new TransactionHost(prisma);
const uow = new PrismaUnitOfWork(txHost);
const clock: ClockPort = new SystemClock();
const videos = new PrismaVideoRepository(txHost);
const wallets = new PrismaWalletRepository(txHost);
const orders = new PrismaOrderRepository(txHost);
const topUps = new PrismaTopUpRepository(txHost);
const events = new PrismaPaymentEventRepository(txHost);
const payment: PaymentPort = new SepayAdapter();

const fakeStorage = {
  presignDownload: async () => ({ url: 'https://example.com/file', expiresAt: new Date() }),
} as unknown as StoragePort;

const purchase = new PurchaseVideoUseCase(videos, wallets, orders, uow);
const webhook = new HandlePaymentWebhookUseCase(payment, events, topUps, wallets, clock, uow);
const download = new IssueDownloadLinkUseCase(
  orders, videos, new PrismaDownloadLogRepository(txHost), fakeStorage, clock, uow,
);

let seq = 0;
async function makeUser(balance: number) {
  const u = await prisma.user.create({
    data: { email: `u${Date.now()}-${seq++}@test.local`, wallet: { create: { balance } } },
  });
  return u.id;
}

let categoryId: string;
async function makeVideo(price: number) {
  const v = await prisma.video.create({
    data: {
      title: 'Test', slug: `test-${Date.now()}-${seq++}`, price, durationSec: 10, categoryId,
      status: 'PUBLISHED', publishedAt: new Date(), fileKey: 'originals/x/y.mp4',
    },
  });
  return v.id;
}

const auth = { authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` };

beforeAll(async () => {
  await prisma.$connect();
  categoryId = (await prisma.category.create({ data: { name: 'Test', slug: `test-${Date.now()}` } })).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Mua video – tranh chấp đồng thời', () => {
  it('2 request mua cùng lúc, số dư chỉ đủ 1 video → chỉ 1 thành công', async () => {
    const userId = await makeUser(15_000);
    const [v1, v2] = [await makeVideo(10_000), await makeVideo(10_000)];

    const results = await Promise.allSettled([
      purchase.execute({ userId, videoId: v1 }),
      purchase.execute({ userId, videoId: v2 }),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(['INSUFFICIENT_BALANCE', 'CONCURRENT_UPDATE']).toContain(failed[0]!.reason.code);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(wallet.balance).toBe(5_000);
    expect(await prisma.order.count({ where: { userId } })).toBe(1);
    expect(await prisma.walletTransaction.count({ where: { walletId: wallet.id } })).toBe(1);
  });

  it('bấm mua 2 lần cùng 1 video → chỉ trừ xu 1 lần', async () => {
    const userId = await makeUser(100_000);
    const v = await makeVideo(10_000);
    const results = await Promise.allSettled([
      purchase.execute({ userId, videoId: v }),
      purchase.execute({ userId, videoId: v }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(wallet.balance).toBe(90_000);
  });

  it('mua lại video đã mua → ALREADY_PURCHASED, không trừ xu', async () => {
    const userId = await makeUser(50_000);
    const v = await makeVideo(10_000);
    await purchase.execute({ userId, videoId: v });
    await expect(purchase.execute({ userId, videoId: v })).rejects.toMatchObject({ code: 'ALREADY_PURCHASED' });
    expect((await prisma.wallet.findUniqueOrThrow({ where: { userId } })).balance).toBe(40_000);
  });
});

describe('Webhook SePay', () => {
  async function makeTopUp(userId: string, amount: number) {
    const code = 'TV' + Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, 'X');
    return prisma.topUpRequest.create({
      data: { userId, code, amount, expiresAt: new Date(Date.now() + 30 * 60_000) },
    });
  }

  const body = (id: string, amount: number, content: string) => ({
    id, transactionDate: '2026-10-31 09:00:00', content, transferType: 'in', transferAmount: amount,
  });

  it('webhook gửi 2 lần cùng lúc cho 1 giao dịch → chỉ cộng xu 1 lần', async () => {
    const userId = await makeUser(0);
    const t = await makeTopUp(userId, 50_000);
    const b = body(`tx-${Date.now()}`, 50_000, `CK ${t.code}`);
    const outcomes = await Promise.all([webhook.execute(auth, b), webhook.execute(auth, b), webhook.execute(auth, b)]);
    expect(outcomes.filter((o) => o === 'matched')).toHaveLength(1);
    expect((await prisma.wallet.findUniqueOrThrow({ where: { userId } })).balance).toBe(50_000);
    expect((await prisma.topUpRequest.findUniqueOrThrow({ where: { id: t.id } })).status).toBe('COMPLETED');
  });

  it('chuyển khoản sai nội dung → UNMATCHED, không cộng xu', async () => {
    const userId = await makeUser(0);
    await makeTopUp(userId, 50_000);
    const id = `tx-${Date.now()}-x`;
    expect(await webhook.execute(auth, body(id, 50_000, 'chuyen tien an trua'))).toBe('unmatched');
    expect((await prisma.wallet.findUniqueOrThrow({ where: { userId } })).balance).toBe(0);
    const ev = await prisma.paymentEvent.findFirstOrThrow({ where: { providerTxId: id } });
    expect(ev.status).toBe('UNMATCHED');
  });
});

describe('Tải video', () => {
  it('xin link tải video chưa mua → NOT_PURCHASED', async () => {
    const userId = await makeUser(0);
    const v = await makeVideo(10_000);
    await expect(download.execute({ userId, videoId: v, ip: '1.1.1.1' })).rejects.toMatchObject({ code: 'NOT_PURCHASED' });
  });

  it('đã mua → cấp link và ghi log', async () => {
    const userId = await makeUser(10_000);
    const v = await makeVideo(10_000);
    await purchase.execute({ userId, videoId: v });
    const link = await download.execute({ userId, videoId: v, ip: '1.1.1.1' });
    expect(link.url).toContain('https://');
    expect(await prisma.downloadLog.count({ where: { userId, videoId: v } })).toBe(1);
  });
});
