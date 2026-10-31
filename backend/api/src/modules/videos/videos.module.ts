import { Module } from '@nestjs/common';
import {
  CompleteUploadUseCase,
  CreateVideoUseCase,
  HideVideoUseCase,
  PublishVideoUseCase,
  RequestUploadUrlUseCase,
  UpdateVideoUseCase,
} from './application/manage-video.use-cases';
import { VideoCatalogQuery } from './application/video-catalog.query';
import { VideoRepository } from './domain/video.repository';
import { PrismaVideoRepository } from './infrastructure/prisma-video.repository';
import { VideoPresenter } from './infrastructure/video-presenter';
import { AdminVideosController, VideosController } from './presentation/videos.controller';

@Module({
  controllers: [VideosController, AdminVideosController],
  providers: [
    { provide: VideoRepository, useClass: PrismaVideoRepository },
    VideoPresenter,
    VideoCatalogQuery,
    CreateVideoUseCase,
    UpdateVideoUseCase,
    RequestUploadUrlUseCase,
    CompleteUploadUseCase,
    PublishVideoUseCase,
    HideVideoUseCase,
  ],
  exports: [VideoRepository, VideoPresenter, VideoCatalogQuery],
})
export class VideosModule {}
