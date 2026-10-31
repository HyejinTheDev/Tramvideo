import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  adminListVideosQuery,
  completeUploadSchema,
  createVideoSchema,
  listVideosQuery,
  requestUploadUrlSchema,
  updateVideoSchema,
  type AdminListVideosQuery,
  type CompleteUploadInput,
  type CreateVideoInput,
  type ListVideosQuery,
  type RequestUploadUrlInput,
  type UpdateVideoInput,
} from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Public, Roles } from '../../../shared/presentation/decorators';
import { ZodBody, ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import {
  CompleteUploadUseCase,
  CreateVideoUseCase,
  HideVideoUseCase,
  PublishVideoUseCase,
  RequestUploadUrlUseCase,
  UpdateVideoUseCase,
} from '../application/manage-video.use-cases';
import { VideoCatalogQuery } from '../application/video-catalog.query';

@Controller('videos')
export class VideosController {
  constructor(private readonly catalog: VideoCatalogQuery) {}

  @Get()
  @Public()
  list(@ZodQuery(listVideosQuery) q: ListVideosQuery) {
    return this.catalog.listPublished(q);
  }

  @Get(':slug')
  @Public()
  detail(@Param('slug') slug: string) {
    return this.catalog.getPublishedBySlug(slug);
  }
}

@Controller('admin/videos')
@Roles('ADMIN')
export class AdminVideosController {
  constructor(
    private readonly catalog: VideoCatalogQuery,
    private readonly createVideo: CreateVideoUseCase,
    private readonly updateVideo: UpdateVideoUseCase,
    private readonly requestUploadUrl: RequestUploadUrlUseCase,
    private readonly completeUpload: CompleteUploadUseCase,
    private readonly publishVideo: PublishVideoUseCase,
    private readonly hideVideo: HideVideoUseCase,
  ) {}

  @Get()
  list(@ZodQuery(adminListVideosQuery) q: AdminListVideosQuery) {
    return this.catalog.adminList(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalog.adminGet(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @ZodBody(createVideoSchema) body: CreateVideoInput) {
    return this.createVideo.execute(user.id, body);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ZodBody(updateVideoSchema) body: UpdateVideoInput,
  ) {
    await this.updateVideo.execute(user.id, id, body);
    return this.catalog.adminGet(id);
  }

  @Post(':id/upload-url')
  uploadUrl(@Param('id') id: string, @ZodBody(requestUploadUrlSchema) body: RequestUploadUrlInput) {
    return this.requestUploadUrl.execute(id, body);
  }

  @Post(':id/upload-complete')
  async uploadComplete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ZodBody(completeUploadSchema) body: CompleteUploadInput,
  ) {
    await this.completeUpload.execute(user.id, id, body);
    return this.catalog.adminGet(id);
  }

  @Post(':id/publish')
  async publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.publishVideo.execute(user.id, id);
    return this.catalog.adminGet(id);
  }

  @Post(':id/hide')
  async hide(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.hideVideo.execute(user.id, id);
    return this.catalog.adminGet(id);
  }
}
