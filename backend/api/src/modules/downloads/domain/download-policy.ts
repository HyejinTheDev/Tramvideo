import { DOWNLOADS_PER_VIDEO_PER_DAY } from '@tram/shared';
import { DomainError } from '../../../shared/domain/domain-error';

export class NotPurchasedError extends DomainError {
  constructor() {
    super('NOT_PURCHASED', 'Bạn cần mua video trước khi tải');
  }
}

export class DownloadLimitReachedError extends DomainError {
  constructor(limit: number) {
    super('DOWNLOAD_LIMIT_REACHED', `Bạn đã tải video này ${limit} lần trong 24 giờ qua, vui lòng thử lại sau`);
  }
}

/** Quy tắc: tối đa N lượt tải / video / 24 giờ (không giới hạn số ngày). */
export class DownloadPolicy {
  constructor(readonly limitPerDay: number = DOWNLOADS_PER_VIDEO_PER_DAY) {}

  windowStart(now: Date): Date {
    return new Date(now.getTime() - 24 * 3600 * 1000);
  }

  assertAllowed(downloadsInWindow: number) {
    if (downloadsInWindow >= this.limitPerDay) throw new DownloadLimitReachedError(this.limitPerDay);
  }
}

export abstract class DownloadLogRepository {
  abstract countSince(userId: string, videoId: string, since: Date): Promise<number>;
  abstract record(input: { userId: string; videoId: string; ip: string; userAgent?: string }): Promise<void>;
}
