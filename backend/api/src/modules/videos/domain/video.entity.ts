import type { UploadKind, VideoStatus } from '@tram/shared';
import { Entity } from '../../../shared/domain/entity';
import { Money } from '../../../shared/domain/money';
import { VideoNotReadyError } from './video.errors';

export interface VideoProps {
  title: string;
  slug: string;
  description: string | null;
  price: Money;
  durationSec: number;
  categoryId: string;
  tags: string[];
  status: VideoStatus;
  fileKey: string | null;
  fileSize: number | null;
  previewKey: string | null;
  thumbnailKey: string | null;
  publishedAt: Date | null;
}

export class Video extends Entity {
  private constructor(
    id: string,
    private props: VideoProps,
  ) {
    super(id);
  }

  static restore(id: string, props: VideoProps): Video {
    return new Video(id, { ...props });
  }

  get title() {
    return this.props.title;
  }
  get slug() {
    return this.props.slug;
  }
  get price() {
    return this.props.price;
  }
  get status() {
    return this.props.status;
  }
  get fileKey() {
    return this.props.fileKey;
  }
  get isPublished() {
    return this.props.status === 'PUBLISHED';
  }
  get snapshot(): Readonly<VideoProps> {
    return this.props;
  }

  update(changes: Partial<Omit<VideoProps, 'status' | 'publishedAt'>>) {
    this.props = { ...this.props, ...changes };
  }

  attachFile(kind: UploadKind, key: string, size: number | null) {
    if (kind === 'original') {
      this.props.fileKey = key;
      this.props.fileSize = size;
    } else if (kind === 'preview') {
      this.props.previewKey = key;
    } else {
      this.props.thumbnailKey = key;
    }
  }

  /** Chỉ đăng được khi có đủ file gốc, preview, thumbnail. */
  publish(now: Date) {
    const missing = [
      !this.props.fileKey && 'file gốc',
      !this.props.previewKey && 'preview',
      !this.props.thumbnailKey && 'thumbnail',
    ].filter(Boolean);
    if (missing.length) throw new VideoNotReadyError(missing as string[]);
    this.props.status = 'PUBLISHED';
    this.props.publishedAt ??= now;
  }

  hide() {
    this.props.status = 'HIDDEN';
  }
}
