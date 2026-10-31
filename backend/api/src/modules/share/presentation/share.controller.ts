import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { formatVnd } from '@tram/shared';
import { env } from '../../../config/env';
import { Public } from '../../../shared/presentation/decorators';
import { RawResponse } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { VideoCatalogQuery } from '../../videos/application/video-catalog.query';

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/**
 * Link chia sẻ có ảnh xem trước trên Facebook/Zalo (dan_y.md 10.6).
 * Bot đọc thẻ OG; người thật được chuyển ngay về trang video trên web.
 */
@Controller('share')
export class ShareController {
  constructor(private readonly catalog: VideoCatalogQuery) {}

  @Get('videos/:slug')
  @Public()
  @RawResponse()
  async video(@Param('slug') slug: string, @Res() res: Response) {
    const target = `${env.APP_WEB_URL}/video/${encodeURIComponent(slug)}`;
    try {
      const v = await this.catalog.getPublishedBySlug(slug);
      const title = esc(`${v.title} – Trạm Video`);
      const desc = esc(v.description?.slice(0, 200) || `Video ${v.categoryName} giá ${formatVnd(v.price)}`);
      const image = v.thumbnailUrl ? esc(v.thumbnailUrl) : '';
      const url = esc(target);
      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'public, max-age=300')
        .set('Content-Security-Policy', "default-src 'none'; img-src *; script-src 'unsafe-inline'")
        .send(`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>${title}</title>
<meta property="og:type" content="video.other">
<meta property="og:site_name" content="Trạm Video">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${image ? `<meta property="og:image" content="${image}">` : ''}
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${url}">
<link rel="canonical" href="${url}">
</head><body><script>location.replace(${JSON.stringify(target)})</script>
<a href="${url}">Xem video</a></body></html>`);
    } catch {
      res.redirect(302, env.APP_WEB_URL);
    }
  }
}
