import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tram/database';
import { UnitOfWork } from '../../application/unit-of-work';
import { PrismaService } from './prisma.service';

export type Db = Prisma.TransactionClient;

/**
 * Giữ transaction hiện tại trong AsyncLocalStorage.
 * Repository luôn dùng `txHost.tx`: trong `uow.run()` là transaction, ngoài ra là client thường.
 */
@Injectable()
export class TransactionHost {
  private readonly als = new AsyncLocalStorage<Db>();

  constructor(private readonly prisma: PrismaService) {}

  get tx(): Db {
    return this.als.getStore() ?? this.prisma;
  }

  get inTransaction(): boolean {
    return this.als.getStore() !== undefined;
  }

  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Lồng nhau → dùng lại transaction ngoài.
    if (this.inTransaction) return work();
    return this.prisma.$transaction((tx) => this.als.run(tx, work), {
      isolationLevel: 'ReadCommitted',
      timeout: 15_000,
    });
  }
}

@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(private readonly host: TransactionHost) {
    super();
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.host.runInTransaction(work);
  }
}
