import { Injectable } from '@nestjs/common';
import { DOWNLOAD_LINK_TTL_SECONDS, type DownloadLink } from '@tram/shared';
import { ClockPort } from '../../../shared/application/clock.port';
import { StoragePort } from '../../../shared/application/storage.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { DomainError } from '../../../shared/domain/domain-error';
import { OrderRepository } from '../../orders/domain/order.repository';
import { VideoNotFoundError } from '../../videos/domain/video.errors';
import { VideoRepository } from '../../videos/domain/video.repository';
import { DownloadLogRepository, DownloadPolicy, NotPurchasedError } from '../domain/download-policy';

/**
 * Cấp link tải có hạn (dan_y.md 10.3): đã mua? → còn lượt? → presigned GET 10 phút → ghi log.
 * Trình duyệt tải thẳng từ R2, không đi qua server.
 */
@Injectable()
export class IssueDownloadLinkUseCase {
  private readonly policy = new DownloadPolicy();

  constructor(
    private readonly orders: OrderRepository,
    private readonly videos: VideoRepository,
    private readonly logs: DownloadLogRepository,
    private readonly storage: StoragePort,
    private readonly clock: ClockPort,
    private readonly uow: UnitOfWork,
  ) {}

  execute(input: { userId: string; videoId: string; ip: string; userAgent?: string }): Promise<DownloadLink> {
    return this.uow.run(async () => {
      if (!(await this.orders.owns(input.userId, input.videoId))) throw new NotPurchasedError();
      // Video đã mua thì vẫn tải được kể cả khi admin ẩn video.
      const video = await this.videos.findById(input.videoId);
      if (!video) throw new VideoNotFoundError();
      if (!video.fileKey) throw new DomainError('VIDEO_NOT_READY', 'File video chưa sẵn sàng');

      const now = this.clock.now();
      const used = await this.logs.countSince(input.userId, input.videoId, this.policy.windowStart(now));
      this.policy.assertAllowed(used);

      const ext = video.fileKey.split('.').pop() ?? 'mp4';
      const link = await this.storage.presignDownload({
        key: video.fileKey,
        fileName: `${video.slug}.${ext}`,
        expiresInSec: DOWNLOAD_LINK_TTL_SECONDS,
      });
      await this.logs.record(input);
      return { url: link.url, expiresAt: link.expiresAt.toISOString() };
    });
  }
}
