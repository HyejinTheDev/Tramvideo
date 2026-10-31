export type Bucket = 'private' | 'public';

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
}

export interface StoredObject {
  size: number;
  contentType?: string;
}

/** Port lưu file (Cloudflare R2 / S3). */
export abstract class StoragePort {
  abstract presignUpload(input: {
    bucket: Bucket;
    key: string;
    contentType: string;
    expiresInSec: number;
  }): Promise<PresignedUrl>;

  abstract presignDownload(input: {
    key: string;
    fileName: string;
    expiresInSec: number;
  }): Promise<PresignedUrl>;

  abstract head(bucket: Bucket, key: string): Promise<StoredObject | null>;

  /** URL công khai (qua CDN) cho preview/thumbnail. */
  abstract publicUrl(key: string): string;
}
