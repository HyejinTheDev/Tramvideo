import type { Video, VideoProps } from './video.entity';

/** abstract class = interface + token DI. Cài đặt ở infrastructure. */
export abstract class VideoRepository {
  abstract findById(id: string): Promise<Video | null>;
  abstract findPublishedById(id: string): Promise<Video | null>;
  abstract slugExists(slug: string, exceptId?: string): Promise<boolean>;
  abstract categoryExists(categoryId: string): Promise<boolean>;
  abstract create(props: VideoProps): Promise<Video>;
  abstract save(video: Video): Promise<void>;
  abstract incrementPurchaseCount(id: string, by?: number): Promise<void>;
}
