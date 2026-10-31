import { Injectable } from '@nestjs/common';
import { Prisma } from '@tram/database';
import type {
  AdminListVideosQuery,
  AdminVideo,
  ListVideosQuery,
  Paginated,
  VideoDetail,
  VideoSummary,
} from '@tram/shared';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { VideoNotFoundError } from '../domain/video.errors';
import { VideoPresenter } from '../infrastructure/video-presenter';

/**
 * Read model (phía đọc): truy vấn thẳng DB cho danh sách / chi tiết,
 * không đi qua entity vì không có quy tắc nghiệp vụ.
 */
@Injectable()
export class VideoCatalogQuery {
  constructor(
    private readonly txHost: TransactionHost,
    private readonly presenter: VideoPresenter,
  ) {}

  /** Tìm id theo tiêu đề không dấu (dùng index f_unaccent + pg_trgm). */
  private async searchIds(q: string, publishedOnly: boolean): Promise<string[]> {
    const pattern = `%${q.replace(/[%_\\]/g, (c) => '\\' + c)}%`;
    const rows = await this.txHost.tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "Video"
      WHERE f_unaccent(lower(title)) LIKE f_unaccent(lower(${pattern}))
      ${publishedOnly ? Prisma.sql`AND status = 'PUBLISHED'` : Prisma.empty}
      LIMIT 1000`);
    return rows.map((r) => r.id);
  }

  async listPublished(q: ListVideosQuery): Promise<Paginated<VideoSummary>> {
    const where: Prisma.VideoWhereInput = { status: 'PUBLISHED' };
    if (q.category) where.category = { slug: q.category };
    if (q.q) where.id = { in: await this.searchIds(q.q, true) };

    const orderBy: Prisma.VideoOrderByWithRelationInput[] =
      q.sort === 'bestselling'
        ? [{ purchaseCount: 'desc' }, { publishedAt: 'desc' }]
        : q.sort === 'price_asc'
          ? [{ price: 'asc' }]
          : q.sort === 'price_desc'
            ? [{ price: 'desc' }]
            : [{ publishedAt: 'desc' }];

    const db = this.txHost.tx;
    const [rows, total] = await Promise.all([
      db.video.findMany({
        where,
        orderBy: [...orderBy, { id: 'asc' }],
        include: { category: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.video.count({ where }),
    ]);
    return {
      items: rows.map((r) => this.presenter.summary(r)),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }

  async getPublishedBySlug(slug: string): Promise<VideoDetail> {
    const row = await this.txHost.tx.video.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { category: true },
    });
    if (!row) throw new VideoNotFoundError();
    return this.presenter.detail(row);
  }

  // ---------- Admin ----------
  async adminList(q: AdminListVideosQuery): Promise<Paginated<AdminVideo>> {
    const where: Prisma.VideoWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.q) where.id = { in: await this.searchIds(q.q, false) };
    const db = this.txHost.tx;
    const [rows, total] = await Promise.all([
      db.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.video.count({ where }),
    ]);
    return {
      items: rows.map((r) => this.presenter.admin(r)),
      meta: { page: q.page, pageSize: q.pageSize, total },
    };
  }

  async adminGet(id: string): Promise<AdminVideo> {
    const row = await this.txHost.tx.video.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!row) throw new VideoNotFoundError();
    return this.presenter.admin(row);
  }
}
