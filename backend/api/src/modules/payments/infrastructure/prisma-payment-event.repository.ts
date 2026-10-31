import { Injectable } from '@nestjs/common';
import type { PaymentEvent as Row, Prisma } from '@tram/database';
import type { PaymentEventStatus } from '@tram/shared';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { PaymentEvent, PaymentEventRepository, TransferRecord } from '../domain/payment-event';

function toEntity(r: Row) {
  return new PaymentEvent(
    r.id,
    r.providerTxId,
    r.amount,
    r.content,
    r.status,
    r.resolvedById,
    r.resolvedAt,
    r.note,
  );
}

@Injectable()
export class PrismaPaymentEventRepository extends PaymentEventRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  async record(t: TransferRecord, status: PaymentEventStatus) {
    // INSERT ... ON CONFLICT DO NOTHING: không ném lỗi khi trùng → transaction vẫn dùng tiếp được.
    const { count } = await this.txHost.tx.paymentEvent.createMany({
      data: [
        {
          provider: t.provider,
          providerTxId: t.providerTxId,
          amount: t.amount,
          content: t.content,
          bankAccount: t.bankAccount,
          transferredAt: t.transferredAt,
          raw: t.raw as Prisma.InputJsonValue,
          status,
        },
      ],
      skipDuplicates: true,
    });
    const row = await this.txHost.tx.paymentEvent.findUniqueOrThrow({
      where: { provider_providerTxId: { provider: t.provider, providerTxId: t.providerTxId } },
    });
    return { event: toEntity(row), isNew: count === 1 };
  }

  async findById(id: string) {
    const r = await this.txHost.tx.paymentEvent.findUnique({ where: { id } });
    return r ? toEntity(r) : null;
  }

  async save(e: PaymentEvent) {
    await this.txHost.tx.paymentEvent.update({
      where: { id: e.id },
      data: {
        status: e.status,
        resolvedById: e.resolvedById,
        resolvedAt: e.resolvedAt,
        note: e.note,
      },
    });
  }
}
