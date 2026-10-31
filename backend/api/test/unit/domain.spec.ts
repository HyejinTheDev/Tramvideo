import { Money } from '../../src/shared/domain/money';
import { InsufficientBalanceError, Wallet } from '../../src/modules/wallet/domain/wallet.entity';
import { Order } from '../../src/modules/orders/domain/order.entity';
import { AlreadyPurchasedError } from '../../src/modules/orders/domain/order.errors';
import { extractTopUpCode, generateTopUpCode, TopUpRequest } from '../../src/modules/wallet/domain/top-up';
import { Video } from '../../src/modules/videos/domain/video.entity';
import { DownloadLimitReachedError, DownloadPolicy } from '../../src/modules/downloads/domain/download-policy';

describe('Money', () => {
  it('chỉ nhận số nguyên không âm', () => {
    expect(() => Money.vnd(-1)).toThrow();
    expect(() => Money.vnd(1.5)).toThrow();
    expect(Money.vnd(0).amount).toBe(0);
  });

  it('cộng trừ bất biến', () => {
    const a = Money.vnd(10_000);
    expect(a.add(Money.vnd(5_000)).amount).toBe(15_000);
    expect(a.subtract(Money.vnd(4_000)).amount).toBe(6_000);
    expect(a.amount).toBe(10_000);
    expect(() => a.subtract(Money.vnd(10_001))).toThrow();
  });
});

describe('Wallet', () => {
  it('debit trừ đúng số dư', () => {
    const w = new Wallet('w1', 'u1', Money.vnd(20_000), 0);
    w.debit(Money.vnd(15_000));
    expect(w.balance.amount).toBe(5_000);
  });

  it('không đủ xu → INSUFFICIENT_BALANCE, số dư giữ nguyên', () => {
    const w = new Wallet('w1', 'u1', Money.vnd(5_000), 0);
    expect(() => w.debit(Money.vnd(5_001))).toThrow(InsufficientBalanceError);
    expect(w.balance.amount).toBe(5_000);
  });

  it('credit cộng xu', () => {
    const w = new Wallet('w1', 'u1', Money.zero(), 0);
    w.credit(Money.vnd(50_000));
    expect(w.balance.amount).toBe(50_000);
  });
});

describe('Order', () => {
  it('create → COMPLETED với giá tại thời điểm mua', () => {
    const o = Order.create({ userId: 'u', videoId: 'v', price: Money.vnd(12_000) });
    expect(o.status).toBe('COMPLETED');
    expect(o.price.amount).toBe(12_000);
    expect(o.isNew).toBe(true);
  });

  it('refund 1 lần; mua lại sau khi hoàn được', () => {
    const o = Order.create({ userId: 'u', videoId: 'v', price: Money.vnd(12_000) });
    expect(() => o.repurchase(Money.vnd(1))).toThrow(AlreadyPurchasedError);
    o.refund(new Date());
    expect(o.status).toBe('REFUNDED');
    expect(() => o.refund(new Date())).toThrow();
    o.repurchase(Money.vnd(15_000));
    expect(o.status).toBe('COMPLETED');
    expect(o.price.amount).toBe(15_000);
  });
});

describe('Mã nạp xu', () => {
  it('sinh mã đúng định dạng và tách lại được từ nội dung chuyển khoản', () => {
    const code = generateTopUpCode();
    expect(code).toMatch(/^TV[A-Z2-9]{6}$/);
    expect(extractTopUpCode(`NGUYEN VAN A chuyen tien ${code.toLowerCase()} FT2431`)).toBe(code);
    expect(extractTopUpCode(`MBVCB.123.${code}.CT tu 0123`)).toBe(code);
    expect(extractTopUpCode('chuyen tien an trua')).toBeNull();
  });

  it('chỉ khớp khi đúng số tiền và chưa hoàn tất (kể cả đã quá hạn QR)', () => {
    const t = new TopUpRequest('t', 'u', 'TVABCDEF', Money.vnd(50_000), 'PENDING', new Date(0), null, null, new Date());
    expect(t.canMatch(Money.vnd(49_000))).toBe(false);
    expect(t.expireIfDue(new Date())).toBe(true);
    expect(t.canMatch(Money.vnd(50_000))).toBe(true);
    t.complete('pe1', new Date());
    expect(t.canMatch(Money.vnd(50_000))).toBe(false);
  });
});

describe('Video.publish', () => {
  const base = {
    title: 't', slug: 's', description: null, price: Money.vnd(1), durationSec: 1, categoryId: 'c',
    tags: [], status: 'DRAFT' as const, fileKey: null, fileSize: null, previewKey: null,
    thumbnailKey: null, publishedAt: null,
  };

  it('thiếu file → không đăng được', () => {
    const v = Video.restore('v', { ...base, fileKey: 'a' });
    expect(() => v.publish(new Date())).toThrow(/preview, thumbnail/);
  });

  it('đủ file → PUBLISHED', () => {
    const v = Video.restore('v', { ...base, fileKey: 'a', previewKey: 'b', thumbnailKey: 'c' });
    v.publish(new Date());
    expect(v.status).toBe('PUBLISHED');
  });
});

describe('DownloadPolicy', () => {
  it('chặn khi vượt số lượt/ngày', () => {
    const p = new DownloadPolicy(10);
    expect(() => p.assertAllowed(9)).not.toThrow();
    expect(() => p.assertAllowed(10)).toThrow(DownloadLimitReachedError);
  });
});
