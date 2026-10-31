import { Injectable } from '@nestjs/common';
import { ConcurrencyError } from '../../../shared/domain/domain-error';
import { Money } from '../../../shared/domain/money';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { LedgerEntry } from '../domain/ledger-entry';
import { Wallet } from '../domain/wallet.entity';
import { WalletRepository } from '../domain/wallet.repository';

@Injectable()
export class PrismaWalletRepository extends WalletRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  async findByUserId(userId: string): Promise<Wallet> {
    const row = await this.txHost.tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return new Wallet(row.id, row.userId, Money.vnd(row.balance), row.version);
  }

  /** Khoá lạc quan: chỉ cập nhật khi version chưa đổi. */
  async save(wallet: Wallet, entry: LedgerEntry): Promise<void> {
    const { count } = await this.txHost.tx.wallet.updateMany({
      where: { id: wallet.id, version: wallet.version },
      data: { balance: wallet.balance.amount, version: { increment: 1 } },
    });
    if (count === 0) throw new ConcurrencyError();

    await this.txHost.tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: entry.type,
        amount: entry.signedAmount,
        balanceAfter: wallet.balance.amount,
        refType: entry.refType,
        refId: entry.refId,
        note: entry.note,
        createdById: entry.createdById,
      },
    });
  }
}
