import { z } from 'zod';
import { paginationQuery } from './common';
import { slugSchema } from './category';

export const videoStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']);
export type VideoStatus = z.infer<typeof videoStatusSchema>;

export const videoSortSchema = z.enum(['newest', 'bestselling', 'price_asc', 'price_desc']);
export type VideoSort = z.infer<typeof videoSortSchema>;

export const listVideosQuery = paginationQuery.extend({
  category: z.string().max(100).optional(),
  q: z.string().trim().max(100).optional(),
  sort: videoSortSchema.default('newest'),
});
export type ListVideosQuery = z.infer<typeof listVideosQuery>;

/** Thẻ video trong danh sách. Không bao giờ chứa fileKey. */
export const videoSummaryResponse = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  price: z.number().int(),
  durationSec: z.number().int(),
  thumbnailUrl: z.string().nullable(),
  categorySlug: z.string(),
  purchaseCount: z.number().int(),
  publishedAt: z.string().nullable(),
});
export type VideoSummary = z.infer<typeof videoSummaryResponse>;

export const videoDetailResponse = videoSummaryResponse.extend({
  description: z.string().nullable(),
  previewUrl: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  tags: z.array(z.string()),
  categoryName: z.string(),
});
export type VideoDetail = z.infer<typeof videoDetailResponse>;

// ---------- Admin ----------
export const createVideoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema.optional(),
  description: z.string().max(5000).optional(),
  price: z.number().int().min(0).max(100_000_000),
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(24 * 3600),
  categoryId: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
export type CreateVideoInput = z.infer<typeof createVideoSchema>;

export const updateVideoSchema = createVideoSchema.partial();
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

export const uploadKindSchema = z.enum(['original', 'preview', 'thumbnail']);
export type UploadKind = z.infer<typeof uploadKindSchema>;

export const requestUploadUrlSchema = z.object({
  kind: uploadKindSchema,
  contentType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
});
export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;

export const uploadUrlResponse = z.object({
  url: z.string(),
  key: z.string(),
  expiresAt: z.string(),
});
export type UploadUrl = z.infer<typeof uploadUrlResponse>;

export const completeUploadSchema = z.object({
  kind: uploadKindSchema,
  key: z.string().min(1).max(500),
});
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

export const adminListVideosQuery = paginationQuery.extend({
  status: videoStatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
});
export type AdminListVideosQuery = z.infer<typeof adminListVideosQuery>;

export const adminVideoResponse = videoDetailResponse.extend({
  status: videoStatusSchema,
  categoryId: z.string(),
  hasOriginal: z.boolean(),
  hasPreview: z.boolean(),
  hasThumbnail: z.boolean(),
  fileSize: z.number().nullable(),
  createdAt: z.string(),
});
export type AdminVideo = z.infer<typeof adminVideoResponse>;
