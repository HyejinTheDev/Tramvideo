import { Injectable } from '@nestjs/common';
import type { TopUpRequest as Row } from '@tram/database';
import { Money } from '../../../shared/domain/money';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { TopUpRepository, TopUpRequest } from '../domain/top-up';

function toEntity(r: Row): TopUpRequest {
  return new TopUpRequest(
    r.id,
    r.userId,
    r.code,
    Money.vnd(r.amount),
    r.status,
    r.expiresAt,
    r.completedAt,
    r.paymentEventId,
    r.createdAt,
  );
}

@Injectable()
export class PrismaTopUpRepository extends TopUpRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  async create(input: { userId: string; code: string; amount: Money; expiresAt: Date }) {
    const r = await this.txHost.tx.topUpRequest.create({
      data: {
        userId: input.userId,
        code: input.code,
        amount: input.amount.amount,
        expiresAt: input.expiresAt,
      },
    });
    return toEntity(r);
  }

  async codeExists(code: string) {
    return (await this.txHost.tx.topUpRequest.count({ where: { code } })) > 0;
  }

  async findById(id: string) {
    const r = await this.txHost.tx.topUpRequest.findUnique({ where: { id } });
    return r ? toEntity(r) : null;
  }

  async findByCode(code: string) {
    const r = await this.txHost.tx.topUpRequest.findUnique({ where: { code } });
    return r ? toEntity(r) : null;
  }

  async save(t: TopUpRequest) {
    await this.txHost.tx.topUpRequest.update({
      where: { id: t.id },
      data: {
        status: t.status,
        completedAt: t.completedAt,
        paymentEventId: t.paymentEventId,
      },
    });
  }

  countRecentByUser(userId: string, since: Date) {
    return this.txHost.tx.topUpRequest.count({ where: { userId, createdAt: { gte: since } } });
  }
}
