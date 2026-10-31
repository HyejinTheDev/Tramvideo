import { Controller, Get, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../presentation/decorators';
import { RawResponse } from '../../presentation/pipes/zod-validation.pipe';

/**
 * CHỈ dùng ở dev khi chưa cấu hình R2: nhận upload giả và trả file tải giả,
 * để chạy thử trọn luồng upload → đăng → mua → tải mà không cần Cloudflare.
 * Không được đăng ký ở production (xem app.module.ts).
 */
@Controller()
export class DevStorageController {
  @Put('dev-upload/*')
  @Public()
  @RawResponse()
  upload(@Req() req: Request, @Res() res: Response) {
    let size = 0;
    req.on('data', (chunk: Buffer) => (size += chunk.length));
    req.on('end', () => res.status(200).json({ ok: true, size }));
  }

  @Get('dev-download/*')
  @Public()
  @RawResponse()
  download(@Req() req: Request, @Res() res: Response) {
    const key = decodeURIComponent(req.path.replace(/^\/dev-download\//, ''));
    res
      .status(200)
      .set('Content-Disposition', `attachment; filename="${key.split('/').pop() ?? 'video.mp4'}.txt"`)
      .type('text/plain')
      .send(`Đây là file giả lập (dev) cho key: ${key}\nCấu hình R2 trong .env để tải file thật.`);
  }
}
