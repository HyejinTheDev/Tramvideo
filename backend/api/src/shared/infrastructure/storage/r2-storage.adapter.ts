import { Injectable, Logger } from '@nestjs/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../../config/env';
import { Bucket, PresignedUrl, StoragePort, StoredObject } from '../../application/storage.port';

/**
 * Cloudflare R2 (S3-compatible). Khi chưa cấu hình R2 (dev), adapter vẫn trả URL giả
 * để luồng chạy được; head() coi như file tồn tại.
 */
@Injectable()
export class R2StorageAdapter extends StoragePort {
  private readonly logger = new Logger(R2StorageAdapter.name);
  private readonly client: S3Client | null;

  constructor() {
    super();
    if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });
    } else {
      this.client = null;
      this.logger.warn('R2 chưa cấu hình → dùng chế độ giả lập (dev).');
    }
  }

  private bucketName(bucket: Bucket) {
    return bucket === 'private' ? env.R2_BUCKET_PRIVATE : env.R2_BUCKET_PUBLIC;
  }

  async presignUpload(input: {
    bucket: Bucket;
    key: string;
    contentType: string;
    expiresInSec: number;
  }): Promise<PresignedUrl> {
    const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);
    if (!this.client) {
      return { url: `${env.APP_API_URL}/dev-upload/${encodeURIComponent(input.key)}`, expiresAt };
    }
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucketName(input.bucket),
        Key: input.key,
        ContentType: input.contentType,
      }),
      { expiresIn: input.expiresInSec },
    );
    return { url, expiresAt };
  }

  async presignDownload(input: {
    key: string;
    fileName: string;
    expiresInSec: number;
  }): Promise<PresignedUrl> {
    const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);
    if (!this.client) {
      return { url: `${env.APP_API_URL}/dev-download/${encodeURIComponent(input.key)}`, expiresAt };
    }
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_PRIVATE,
        Key: input.key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
      }),
      { expiresIn: input.expiresInSec },
    );
    return { url, expiresAt };
  }

  async head(bucket: Bucket, key: string): Promise<StoredObject | null> {
    if (!this.client) return { size: 0 };
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketName(bucket), Key: key }),
      );
      return { size: Number(res.ContentLength ?? 0), contentType: res.ContentType };
    } catch (e: unknown) {
      const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw e;
    }
  }

  publicUrl(key: string): string {
    return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
}
