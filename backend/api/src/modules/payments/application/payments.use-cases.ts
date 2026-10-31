import { Injectable, Logger } from '@nestjs/common';
import type {
  AdminPaymentsQuery,
  Paginated,
  PaymentEvent as PaymentEventDto,
  ResolvePaymentInput,
} from '@tram/shared';
import { ClockPort } from '../../../shared/application/clock.port';
import { PaymentPort } from '../../../shared/application/payment.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { NotFoundError, UnauthorizedError } from '../../../shared/domain/domain-error';
import { Money } from '../../../shared/domain/money';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { AuditLogger } from '../../audit/application/audit-logger';
import { LedgerEntry } from '../../wallet/domain/ledger-entry';
import { extractTopUpCode, TopUpRepository } from '../../wallet/domain/top-up';
import { WalletRepository } from '../../wallet/domain/wallet.repository';
import { PaymentEventRepository } from '../domain/payment-event';

export type WebhookOutcome = 'duplicate' | 'ignored' | 'matched' | 'unmatched';

/**
 * Xử lý webhook báo có (dan_y.md 10.1):
 * 1. Kiểm tra API key  2. Lưu event (trùng → bỏ qua)  3. Tách mã TV...
 * 4. Khớp TopUpRequest → cộng xu + ghi sổ cái + COMPLETED; không khớp → UNMATCHED.
 */
@Injectable()
export class HandlePaymentWebhookUseCase {
  private readonly logger = new Logger('PaymentWebhook');

  constructor(
    private readonly payment: PaymentPort,
    private readonly events: PaymentEventRepository,
    private readonly topUps: TopUpRepository,
    private readonly wallets: WalletRepository,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<WebhookOutcome> {
    if (!this.payment.verifyWebhook(headers)) throw new UnauthorizedError('Sai API key webhook');
    const transfer = this.payment.parseWebhook(body);

    const outcome = await this.uow.run(async (): Promise<WebhookOutcome> => {
      if (!transfer.isIncoming) {
        const { isNew } = await this.events.record(transfer, 'IGNORED');
        return isNew ? 'ignored' : 'duplicate';
      }

      const { event, isNew } = await this.events.record(transfer, 'UNMATCHED');
      if (!isNew) return 'duplicate';

      const code = extractTopUpCode(transfer.content);
      const topUp = code ? await this.topUps.findByCode(code) : null;
      const amount = Money.vnd(transfer.amount);

      if (!topUp || !topUp.canMatch(amount)) return 'unmatched';

      const wallet = await this.wallets.findByUserId(topUp.userId);
      wallet.credit(amount);
      await this.wallets.save(wallet, LedgerEntry.topUp(amount, topUp.id));
      topUp.complete(event.id, this.clock.now());
      await this.topUps.save(topUp);
      event.markMatched();
      await this.events.save(event);
      return 'matched';
    });

    if (outcome === 'unmatched') {
      // TODO giai đoạn vận hành: bắn cảnh báo Telegram/email cho admin.
      this.logger.warn(
        `Khoản nạp chưa khớp: tx=${transfer.providerTxId} số tiền=${transfer.amount} nội dung="${transfer.content}"`,
      );
    }
    return outcome;
  }
}

@Injectable()
export class ListPaymentEventsQuery {
  constructor(private readonly txHost: TransactionHost) {}

  async execute(q: AdminPaymentsQuery): Promise<Paginated<PaymentEventDto>> {
    const db = this.txHost.tx;
    const where = q.status ? { status: q.status } : {};
    const [rows, total] = await Promise.all([
      db.paymentEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.paymentEvent.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        provider: r.provider,
        providerTxId: r.providerTxId,
        amount: r.amount,
        content: r.content,
        status: r.status,
        transferredAt: r.transferredAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}

/** Admin gán khoản nạp chưa khớp cho user (cộng theo số thực nhận) hoặc bỏ qua. */
@Injectable()
export class ResolvePaymentUseCase {
  constructor(
    private readonly events: PaymentEventRepository,
    private readonly wallets: WalletRepository,
    private readonly txHost: TransactionHost,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(adminId: string, eventId: string, input: ResolvePaymentInput): Promise<void> {
    return this.uow.run(async () => {
      const event = await this.events.findById(eventId);
      if (!event) throw new NotFoundError('Không tìm thấy khoản nạp');

      if (input.action === 'ignore') {
        event.resolve(adminId, this.clock.now(), input.note, 'IGNORED');
        await this.events.save(event);
      } else {
        const userExists = await this.txHost.tx.user.count({ where: { id: input.userId } });
        if (!userExists) throw new NotFoundError('Không tìm thấy người dùng');
        event.resolve(adminId, this.clock.now(), input.note, 'RESOLVED');
        await this.events.save(event);
        const amount = Money.vnd(input.amount);
        const wallet = await this.wallets.findByUserId(input.userId);
        wallet.credit(amount);
        await this.wallets.save(wallet, LedgerEntry.manualTopUp(amount, event.id, adminId, input.note));
      }

      await this.audit.log({
        actorId: adminId,
        action: input.action === 'ignore' ? 'payment.ignore' : 'payment.credit',
        targetType: 'payment',
        targetId: eventId,
        data: input,
      });
    });
  }
}
