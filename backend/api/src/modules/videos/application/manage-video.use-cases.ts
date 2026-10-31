import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  slugify,
  type CompleteUploadInput,
  type CreateVideoInput,
  type RequestUploadUrlInput,
  type UpdateVideoInput,
  type UploadUrl,
} from '@tram/shared';
import { ClockPort } from '../../../shared/application/clock.port';
import { StoragePort } from '../../../shared/application/storage.port';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { DomainError, ValidationError } from '../../../shared/domain/domain-error';
import { Money } from '../../../shared/domain/money';
import { AuditLogger } from '../../audit/application/audit-logger';
import { Video } from '../domain/video.entity';
import { SlugTakenError, VideoNotFoundError } from '../domain/video.errors';
import { VideoRepository } from '../domain/video.repository';

const UPLOAD_URL_TTL_SEC = 60 * 60; // 1 giờ – đủ cho file lớn

async function loadOrThrow(videos: VideoRepository, id: string): Promise<Video> {
  const v = await videos.findById(id);
  if (!v) throw new VideoNotFoundError();
  return v;
}

/** Admin tạo bản nháp video. */
@Injectable()
export class CreateVideoUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(actorId: string, input: CreateVideoInput): Promise<{ id: string }> {
    return this.uow.run(async () => {
      if (!(await this.videos.categoryExists(input.categoryId))) {
        throw new DomainError('CATEGORY_NOT_FOUND', 'Danh mục không tồn tại');
      }
      const slug = await this.uniqueSlug(input.slug || slugify(input.title));
      const video = await this.videos.create({
        title: input.title,
        slug,
        description: input.description ?? null,
        price: Money.vnd(input.price),
        durationSec: input.durationSec,
        categoryId: input.categoryId,
        tags: input.tags,
        status: 'DRAFT',
        fileKey: null,
        fileSize: null,
        previewKey: null,
        thumbnailKey: null,
        publishedAt: null,
      });
      await this.audit.log({ actorId, action: 'video.create', targetType: 'video', targetId: video.id });
      return { id: video.id };
    });
  }

  private async uniqueSlug(base: string) {
    if (!base) base = 'video';
    let slug = base;
    for (let i = 2; await this.videos.slugExists(slug); i++) slug = `${base}-${i}`;
    return slug;
  }
}

@Injectable()
export class UpdateVideoUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(actorId: string, id: string, input: UpdateVideoInput): Promise<void> {
    return this.uow.run(async () => {
      const video = await loadOrThrow(this.videos, id);
      if (input.slug && (await this.videos.slugExists(input.slug, id))) throw new SlugTakenError();
      if (input.categoryId && !(await this.videos.categoryExists(input.categoryId))) {
        throw new DomainError('CATEGORY_NOT_FOUND', 'Danh mục không tồn tại');
      }
      video.update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.price !== undefined && { price: Money.vnd(input.price) }),
        ...(input.durationSec !== undefined && { durationSec: input.durationSec }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.tags !== undefined && { tags: input.tags }),
      });
      await this.videos.save(video);
      await this.audit.log({
        actorId,
        action: 'video.update',
        targetType: 'video',
        targetId: id,
        data: { fields: Object.keys(input) },
      });
    });
  }
}

const ALLOWED_TYPES: Record<string, RegExp> = {
  original: /^video\//,
  preview: /^video\//,
  thumbnail: /^image\/(jpeg|png|webp)$/,
};

/** Xin presigned URL để trình duyệt upload thẳng lên R2 (không đi qua server). */
@Injectable()
export class RequestUploadUrlUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(id: string, input: RequestUploadUrlInput): Promise<UploadUrl> {
    const video = await loadOrThrow(this.videos, id);
    if (!ALLOWED_TYPES[input.kind]!.test(input.contentType)) {
      throw new ValidationError(`Định dạng ${input.contentType} không hợp lệ cho ${input.kind}`);
    }
    const ext = (input.fileName.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const folder = input.kind === 'original' ? 'originals' : input.kind === 'preview' ? 'previews' : 'thumbnails';
    const key = `${folder}/${video.id}/${randomUUID()}.${ext}`;
    const presigned = await this.storage.presignUpload({
      bucket: input.kind === 'original' ? 'private' : 'public',
      key,
      contentType: input.contentType,
      expiresInSec: UPLOAD_URL_TTL_SEC,
    });
    return { url: presigned.url, key, expiresAt: presigned.expiresAt.toISOString() };
  }
}

/** Xác nhận upload xong: kiểm tra file tồn tại trên R2, lưu key + dung lượng. */
@Injectable()
export class CompleteUploadUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly storage: StoragePort,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(actorId: string, id: string, input: CompleteUploadInput): Promise<void> {
    return this.uow.run(async () => {
      const video = await loadOrThrow(this.videos, id);
      // Key phải thuộc đúng video này (chặn gán file của video khác).
      if (!input.key.includes(`/${video.id}/`)) throw new ValidationError('Key không thuộc video này');
      const obj = await this.storage.head(input.kind === 'original' ? 'private' : 'public', input.key);
      if (!obj) throw new ValidationError('Không tìm thấy file trên kho lưu trữ, hãy upload lại');
      video.attachFile(input.kind, input.key, obj.size || null);
      await this.videos.save(video);
      await this.audit.log({
        actorId,
        action: 'video.upload',
        targetType: 'video',
        targetId: id,
        data: { kind: input.kind, size: obj.size },
      });
    });
  }
}

@Injectable()
export class PublishVideoUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly uow: UnitOfWork,
    private readonly clock: ClockPort,
    private readonly audit: AuditLogger,
  ) {}

  execute(actorId: string, id: string): Promise<void> {
    return this.uow.run(async () => {
      const video = await loadOrThrow(this.videos, id);
      video.publish(this.clock.now());
      await this.videos.save(video);
      await this.audit.log({ actorId, action: 'video.publish', targetType: 'video', targetId: id });
    });
  }
}

@Injectable()
export class HideVideoUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  execute(actorId: string, id: string): Promise<void> {
    return this.uow.run(async () => {
      const video = await loadOrThrow(this.videos, id);
      video.hide();
      await this.videos.save(video);
      await this.audit.log({ actorId, action: 'video.hide', targetType: 'video', targetId: id });
    });
  }
}
