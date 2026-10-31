import { Injectable } from '@nestjs/common';
import {
  TOPUP_EXPIRES_MINUTES,
  type CreateTopUpInput,
  type Paginated,
  type PaginationQuery,
  type TopUp,
  type Wallet as WalletDto,
  type WalletAdjustmentInput,
  type WalletTransaction,
} from '@tram/shared';
import { ClockPort } from '../../../shared/application/clock.port';
import { PaymentPort } from '../../../shared/application/payment.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { DomainError, NotFoundError } from '../../../shared/domain/domain-error';
import { Money } from '../../../shared/domain/money';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { AuditLogger } from '../../audit/application/audit-logger';
import { LedgerEntry } from '../domain/ledger-entry';
import {
  generateTopUpCode,
  TopUpNotFoundError,
  TopUpRepository,
  TopUpRequest,
} from '../domain/top-up';
import { WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class GetMyWalletQuery {
  constructor(private readonly wallets: WalletRepository) {}

  async execute(userId: string): Promise<WalletDto> {
    const w = await this.wallets.findByUserId(userId);
    return { balance: w.balance.amount };
  }
}

@Injectable()
export class ListMyTransactionsQuery {
  constructor(private readonly txHost: TransactionHost) {}

  async execute(userId: string, q: PaginationQuery): Promise<Paginated<WalletTransaction>> {
    const db = this.txHost.tx;
    const where = { wallet: { userId } };
    const [rows, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.walletTransaction.count({ where }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        balanceAfter: r.balanceAfter,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }
}

/** Đổi entity → DTO kèm link ảnh QR và thông tin ngân hàng. */
@Injectable()
export class TopUpPresenter {
  constructor(private readonly payment: PaymentPort) {}

  toDto(t: TopUpRequest): TopUp {
    const bank = this.payment.bankInfo();
    return {
      id: t.id,
      code: t.code,
      amount: t.amount.amount,
      status: t.status,
      qrUrl: this.payment.buildQrUrl({ amount: t.amount.amount, content: t.code }),
      bankCode: bank.bankCode,
      bankAccountNo: bank.accountNo,
      bankAccountName: bank.accountName,
      expiresAt: t.expiresAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
    };
  }
}

@Injectable()
export class CreateTopUpUseCase {
  constructor(
    private readonly topUps: TopUpRepository,
    private readonly clock: ClockPort,
    private readonly presenter: TopUpPresenter,
  ) {}

  async execute(userId: string, input: CreateTopUpInput): Promise<TopUp> {
    const now = this.clock.now();
    // Chống spam: tối đa 5 yêu cầu / 10 phút / user.
    const recent = await this.topUps.countRecentByUser(userId, new Date(now.getTime() - 10 * 60_000));
    if (recent >= 5) throw new DomainError('RATE_LIMITED', 'Bạn tạo yêu cầu nạp quá nhanh, thử lại sau ít phút');

    let code = generateTopUpCode();
    for (let i = 0; await this.topUps.codeExists(code); i++) {
      if (i > 10) throw new Error('Không sinh được mã nạp duy nhất');
      code = generateTopUpCode();
    }
    const topUp = await this.topUps.create({
      userId,
      code,
      amount: Money.vnd(input.amount),
      expiresAt: new Date(now.getTime() + TOPUP_EXPIRES_MINUTES * 60_000),
    });
    return this.presenter.toDto(topUp);
  }
}

@Injectable()
export class GetMyTopUpQuery {
  constructor(
    private readonly topUps: TopUpRepository,
    private readonly clock: ClockPort,
    private readonly presenter: TopUpPresenter,
  ) {}

  async execute(userId: string, id: string): Promise<TopUp> {
    const t = await this.topUps.findById(id);
    if (!t || t.userId !== userId) throw new TopUpNotFoundError();
    if (t.expireIfDue(this.clock.now())) await this.topUps.save(t);
    return this.presenter.toDto(t);
  }
}

/** Admin điều chỉnh xu tay (bắt buộc ghi lý do, ghi AuditLog). */
@Injectable()
export class AdjustWalletUseCase {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly txHost: TransactionHost,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(adminId: string, userId: string, input: WalletAdjustmentInput): Promise<WalletDto> {
    return this.uow.run(async () => {
      const exists = await this.txHost.tx.user.count({ where: { id: userId } });
      if (!exists) throw new NotFoundError('Không tìm thấy người dùng');
      const wallet = await this.wallets.findByUserId(userId);
      const amount = Money.vnd(Math.abs(input.amount));
      if (input.amount > 0) wallet.credit(amount);
      else wallet.debit(amount);
      await this.wallets.save(wallet, LedgerEntry.adjustment(input.amount, adminId, input.note));
      await this.audit.log({
        actorId: adminId,
        action: 'wallet.adjust',
        targetType: 'user',
        targetId: userId,
        data: { amount: input.amount, note: input.note, balanceAfter: wallet.balance.amount },
      });
      return { balance: wallet.balance.amount };
    });
  }
}
