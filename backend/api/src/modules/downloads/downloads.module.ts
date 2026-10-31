import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { VideosModule } from '../videos/videos.module';
import { IssueDownloadLinkUseCase } from './application/issue-download-link.use-case';
import { DownloadLogRepository } from './domain/download-policy';
import { PrismaDownloadLogRepository } from './infrastructure/prisma-download-log.repository';
import { DownloadsController } from './presentation/downloads.controller';

@Module({
  imports: [OrdersModule, VideosModule],
  controllers: [DownloadsController],
  providers: [
    { provide: DownloadLogRepository, useClass: PrismaDownloadLogRepository },
    IssueDownloadLinkUseCase,
  ],
})
export class DownloadsModule {}
