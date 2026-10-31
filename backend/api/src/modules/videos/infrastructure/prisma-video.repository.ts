import { Injectable } from '@nestjs/common';
import type { Video as VideoRow } from '@tram/database';
import { Money } from '../../../shared/domain/money';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { Video, VideoProps } from '../domain/video.entity';
import { VideoRepository } from '../domain/video.repository';

export function toVideoEntity(row: VideoRow): Video {
  return Video.restore(row.id, {
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: Money.vnd(row.price),
    durationSec: row.durationSec,
    categoryId: row.categoryId,
    tags: row.tags,
    status: row.status,
    fileKey: row.fileKey,
    fileSize: row.fileSize === null ? null : Number(row.fileSize),
    previewKey: row.previewKey,
    thumbnailKey: row.thumbnailKey,
    publishedAt: row.publishedAt,
  });
}

function toRow(p: VideoProps) {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: p.price.amount,
    durationSec: p.durationSec,
    categoryId: p.categoryId,
    tags: p.tags,
    status: p.status,
    fileKey: p.fileKey,
    fileSize: p.fileSize === null ? null : BigInt(p.fileSize),
    previewKey: p.previewKey,
    thumbnailKey: p.thumbnailKey,
    publishedAt: p.publishedAt,
  };
}

@Injectable()
export class PrismaVideoRepository extends VideoRepository {
  constructor(private readonly txHost: TransactionHost) {
    super();
  }

  async findById(id: string) {
    const row = await this.txHost.tx.video.findUnique({ where: { id } });
    return row ? toVideoEntity(row) : null;
  }

  async findPublishedById(id: string) {
    const row = await this.txHost.tx.video.findFirst({ where: { id, status: 'PUBLISHED' } });
    return row ? toVideoEntity(row) : null;
  }

  async slugExists(slug: string, exceptId?: string) {
    const row = await this.txHost.tx.video.findUnique({ where: { slug }, select: { id: true } });
    return !!row && row.id !== exceptId;
  }

  async categoryExists(categoryId: string) {
    return (await this.txHost.tx.category.count({ where: { id: categoryId } })) > 0;
  }

  async create(props: VideoProps) {
    const row = await this.txHost.tx.video.create({ data: toRow(props) });
    return toVideoEntity(row);
  }

  async save(video: Video) {
    await this.txHost.tx.video.update({ where: { id: video.id }, data: toRow(video.snapshot) });
  }

  async incrementPurchaseCount(id: string, by = 1) {
    await this.txHost.tx.video.update({
      where: { id },
      data: { purchaseCount: { increment: by } },
    });
  }
}
