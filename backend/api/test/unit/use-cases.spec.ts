/**
 * Unit test use case với repository giả (in-memory) — không cần DB.
 */
process.env.APP_WEB_URL ??= 'http://localhost:5173';
process.env.APP_ADMIN_URL ??= 'http://localhost:5174';
process.env.APP_API_URL ??= 'http://localhost:3000';
process.env.COOKIE_DOMAIN ??= 'localhost';
process.env.DATABASE_URL ??= 'postgresql://x';
process.env.REDIS_URL ??= 'redis://x';
process.env.JWT_ACCESS_SECRET ??= 'x'.repeat(32);
process.env.JWT_REFRESH_SECRET ??= 'y'.repeat(32);
process.env.R2_PUBLIC_BASE_URL ??= 'https://cdn.example.com';
process.env.SEPAY_WEBHOOK_API_KEY ??= 'test-sepay-key';

import { UnitOfWork } from '../../src/shared/application/unit-of-work';
import { IncomingTransfer, PaymentPort } from '../../src/shared/application/payment.port';
import { ClockPort } from '../../src/shared/application/clock.port';
import { Money } from '../../src/shared/domain/money';
import { Video } from '../../src/modules/videos/domain/video.entity';
import { VideoRepository } from '../../src/modules/videos/domain/video.repository';
import { Wallet } from '../../src/modules/wallet/domain/wallet.entity';
import { WalletRepository } from '../../src/modules/wallet/domain/wallet.repository';
import { LedgerEntry } from '../../src/modules/wallet/domain/ledger-entry';
import { TopUpRepository, TopUpRequest } from '../../src/modules/wallet/domain/top-up';
import { Order } from '../../src/modules/orders/domain/order.entity';
import { OrderRepository } from '../../src/modules/orders/domain/order.repository';
import { PurchaseVideoUseCase } from '../../src/modules/orders/application/purchase-video.use-case';
import { PaymentEvent, PaymentEventRepository } from '../../src/modules/payments/domain/payment-event';
import { HandlePaymentWebhookUseCase } from '../../src/modules/payments/application/payments.use-cases';

class FakeUow extends UnitOfWork {
  run<T>(work: () => Promise<T>) {
    return work();
  }
}

class FakeVideos extends VideoRepository {
  purchaseCounts = new Map<string, number>();
  constructor(private readonly items: Video[]) {
    super();
  }
  async findById(id: string) {
    return this.items.find((v) => v.id === id) ?? null;
  }
  async findPublishedById(id: string) {
    return this.items.find((v) => v.id === id && v.isPublished) ?? null;
  }
  async slugExists() {
    return false;
  }
  async categoryExists() {
    return true;
  }
  async create(): Promise<Video> {
    throw new Error('not used');
  }
  async save() {}
  async incrementPurchaseCount(id: string, by = 1) {
    this.purchaseCounts.set(id, (this.purchaseCounts.get(id) ?? 0) + by);
  }
}

class FakeWallets extends WalletRepository {
  ledger: LedgerEntry[] = [];
  constructor(public balances: Map<string, number>) {
    super();
  }
  async findByUserId(userId: string) {
    return new Wallet('w-' + userId, userId, Money.vnd(this.balances.get(userId) ?? 0), 0);
  }
  async save(w: Wallet, entry: LedgerEntry) {
    this.balances.set(w.userId, w.balance.amount);
    this.ledger.push(entry);
  }
}

class FakeOrders extends OrderRepository {
  items: Order[] = [];
  async findById(id: string) {
    return this.items.find((o) => o.id === id) ?? null;
  }
  async findByUserAndVideo(u: string, v: string) {
    return this.items.find((o) => o.userId === u && o.videoId === v) ?? null;
  }
  async owns(u: string, v: string) {
    return this.items.some((o) => o.userId === u && o.videoId === v && o.status === 'COMPLETED');
  }
  async save(o: Order) {
    if (!this.items.includes(o)) this.items.push(o);
  }
}

function makeVideo(id: string, price: number, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') {
  return Video.restore(id, {
    title: id, slug: id, description: null, price: Money.vnd(price), durationSec: 10, categoryId: 'c',
    tags: [], status, fileKey: 'k', fileSize: 1, previewKey: 'p', thumbnailKey: 't', publishedAt: new Date(),
  });
}

describe('PurchaseVideoUseCase', () => {
  const setup = (balance: number) => {
    const videos = new FakeVideos([makeVideo('v1', 15_000), makeVideo('draft', 1_000, 'DRAFT')]);
    const wallets = new FakeWallets(new Map([['u1', balance]]));
    const orders = new FakeOrders();
    const uc = new PurchaseVideoUseCase(videos, wallets, orders, new FakeUow());
    return { uc, videos, wallets, orders };
  };

  it('mua thành công: trừ xu, tạo đơn, ghi sổ cái, tăng lượt mua', async () => {
    const { uc, wallets, orders, videos } = setup(20_000);
    const res = await uc.execute({ userId: 'u1', videoId: 'v1' });
    expect(res.balance).toBe(5_000);
    expect(orders.items).toHaveLength(1);
    expect(wallets.ledger[0]).toMatchObject({ type: 'PURCHASE', signedAmount: -15_000 });
    expect(videos.purchaseCounts.get('v1')).toBe(1);
  });

  it('mua lại video đã mua → ALREADY_PURCHASED, không trừ xu', async () => {
    const { uc, wallets } = setup(50_000);
    await uc.execute({ userId: 'u1', videoId: 'v1' });
    await expect(uc.execute({ userId: 'u1', videoId: 'v1' })).rejects.toMatchObject({ code: 'ALREADY_PURCHASED' });
    expect(wallets.balances.get('u1')).toBe(35_000);
  });

  it('không đủ xu → INSUFFICIENT_BALANCE, không tạo đơn', async () => {
    const { uc, orders } = setup(10_000);
    await expect(uc.execute({ userId: 'u1', videoId: 'v1' })).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
    expect(orders.items).toHaveLength(0);
  });

  it('video chưa đăng → VIDEO_NOT_FOUND', async () => {
    const { uc } = setup(10_000);
    await expect(uc.execute({ userId: 'u1', videoId: 'draft' })).rejects.toMatchObject({ code: 'VIDEO_NOT_FOUND' });
  });
});

describe('HandlePaymentWebhookUseCase', () => {
  class FakePayment extends PaymentPort {
    verifyWebhook(h: Record<string, unknown>) {
      return h['authorization'] === 'ok';
    }
    parseWebhook(body: unknown): IncomingTransfer {
      return body as IncomingTransfer;
    }
    buildQrUrl() {
      return '';
    }
    bankInfo() {
      return { bankCode: '', accountNo: '', accountName: '' };
    }
  }
  class FakeEvents extends PaymentEventRepository {
    rows = new Map<string, PaymentEvent>();
    async record(t: IncomingTransfer, status: PaymentEvent['status']) {
      const existing = this.rows.get(t.providerTxId);
      if (existing) return { event: existing, isNew: false };
      const e = new PaymentEvent('pe-' + t.providerTxId, t.providerTxId, t.amount, t.content, status);
      this.rows.set(t.providerTxId, e);
      return { event: e, isNew: true };
    }
    async findById(id: string) {
      return [...this.rows.values()].find((e) => e.id === id) ?? null;
    }
    async save() {}
  }
  class FakeTopUps extends TopUpRepository {
    constructor(public items: TopUpRequest[]) {
      super();
    }
    async create(): Promise<TopUpRequest> {
      throw new Error('not used');
    }
    async codeExists() {
      return false;
    }
    async findById(id: string) {
      return this.items.find((t) => t.id === id) ?? null;
    }
    async findByCode(code: string) {
      return this.items.find((t) => t.code === code) ?? null;
    }
    async save() {}
    async countRecentByUser() {
      return 0;
    }
  }
  class FixedClock extends ClockPort {
    now() {
      return new Date('2026-10-31T00:00:00Z');
    }
  }

  const transfer = (id: string, amount: number, content: string): IncomingTransfer => ({
    provider: 'sepay', providerTxId: id, amount, content, bankAccount: null,
    transferredAt: new Date(), isIncoming: true, raw: {},
  });

  const setup = () => {
    const topUp = new TopUpRequest('t1', 'u1', 'TVABCDEF', Money.vnd(50_000), 'PENDING', new Date('2030-01-01'), null, null, new Date());
    const wallets = new FakeWallets(new Map([['u1', 0]]));
    const events = new FakeEvents();
    const uc = new HandlePaymentWebhookUseCase(new FakePayment(), events, new FakeTopUps([topUp]), wallets, new FixedClock(), new FakeUow());
    return { uc, wallets, topUp, events };
  };

  it('sai API key → UNAUTHORIZED', async () => {
    const { uc } = setup();
    await expect(uc.execute({ authorization: 'sai' }, transfer('1', 50_000, 'TVABCDEF'))).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('webhook gửi 2 lần cùng 1 giao dịch → chỉ cộng xu 1 lần', async () => {
    const { uc, wallets, topUp } = setup();
    const body = transfer('tx1', 50_000, 'CK TVABCDEF');
    expect(await uc.execute({ authorization: 'ok' }, body)).toBe('matched');
    expect(await uc.execute({ authorization: 'ok' }, body)).toBe('duplicate');
    expect(wallets.balances.get('u1')).toBe(50_000);
    expect(wallets.ledger).toHaveLength(1);
    expect(topUp.status).toBe('COMPLETED');
  });

  it('sai nội dung chuyển khoản → UNMATCHED, không cộng xu', async () => {
    const { uc, wallets, events } = setup();
    expect(await uc.execute({ authorization: 'ok' }, transfer('tx2', 50_000, 'chuyen tien'))).toBe('unmatched');
    expect(wallets.balances.get('u1')).toBe(0);
    expect(events.rows.get('tx2')!.status).toBe('UNMATCHED');
  });

  it('đúng mã nhưng sai số tiền → UNMATCHED', async () => {
    const { uc, wallets } = setup();
    expect(await uc.execute({ authorization: 'ok' }, transfer('tx3', 40_000, 'TVABCDEF'))).toBe('unmatched');
    expect(wallets.balances.get('u1')).toBe(0);
  });
});
