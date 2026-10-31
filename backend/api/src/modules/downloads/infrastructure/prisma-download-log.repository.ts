import { Injectable } from '@nestjs/common';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { DownloadLogRepository } from '../domain/download-policy';

@Injectable()
export class PrismaDownloadLogRepository extends DownloadLogRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  countSince(userId: string, videoId: string, since: Date) {
    return this.txHost.tx.downloadLog.count({
      where: { userId, videoId, createdAt: { gte: since } },
    });
  }

  async record(input: { userId: string; videoId: string; ip: string; userAgent?: string }) {
    await this.txHost.tx.downloadLog.create({
      data: { ...input, userAgent: input.userAgent?.slice(0, 300) },
    });
  }
}
