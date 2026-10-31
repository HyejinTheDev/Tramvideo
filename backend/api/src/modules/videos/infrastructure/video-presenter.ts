import { Injectable } from '@nestjs/common';
import type { Category, Video as VideoRow } from '@tram/database';
import type { AdminVideo, VideoDetail, VideoSummary } from '@tram/shared';
import { StoragePort } from '../../../shared/application/storage.port';

type Row = VideoRow & { category: Category };

/** Đổi row DB → DTO trả về API. Không bao giờ để lộ fileKey. */
@Injectable()
export class VideoPresenter {
  constructor(private readonly storage: StoragePort) {}

  private url(key: string | null) {
    return key ? this.storage.publicUrl(key) : null;
  }

  summary(v: Row): VideoSummary {
    return {
      id: v.id,
      slug: v.slug,
      title: v.title,
      price: v.price,
      durationSec: v.durationSec,
      thumbnailUrl: this.url(v.thumbnailKey),
      categorySlug: v.category.slug,
      purchaseCount: v.purchaseCount,
      publishedAt: v.publishedAt?.toISOString() ?? null,
    };
  }

  detail(v: Row): VideoDetail {
    return {
      ...this.summary(v),
      description: v.description,
      previewUrl: this.url(v.previewKey),
      width: v.width,
      height: v.height,
      tags: v.tags,
      categoryName: v.category.name,
    };
  }

  admin(v: Row): AdminVideo {
    return {
      ...this.detail(v),
      status: v.status,
      categoryId: v.categoryId,
      hasOriginal: !!v.fileKey,
      hasPreview: !!v.previewKey,
      hasThumbnail: !!v.thumbnailKey,
      fileSize: v.fileSize === null ? null : Number(v.fileSize),
      createdAt: v.createdAt.toISOString(),
    };
  }
}
