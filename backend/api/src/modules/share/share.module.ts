import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { ShareController } from './presentation/share.controller';

/** Module làm gọn: chỉ có presentation, dùng lại VideoCatalogQuery. */
@Module({
  imports: [VideosModule],
  controllers: [ShareController],
})
export class ShareModule {}
