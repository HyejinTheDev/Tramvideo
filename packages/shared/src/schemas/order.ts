import { z } from 'zod';

export const purchaseVideoSchema = z.object({ videoId: z.string().min(1).max(64) });
export type PurchaseVideoInput = z.infer<typeof purchaseVideoSchema>;

export const orderStatusSchema = z.enum(['COMPLETED', 'REFUNDED']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderResponse = z.object({
  id: z.string(),
  videoId: z.string(),
  videoSlug: z.string(),
  videoTitle: z.string(),
  thumbnailUrl: z.string().nullable(),
  price: z.number().int(),
  status: orderStatusSchema,
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderResponse>;

export const ownershipResponse = z.object({ owned: z.boolean() });
export type Ownership = z.infer<typeof ownershipResponse>;

export const downloadLinkResponse = z.object({ url: z.string(), expiresAt: z.string() });
export type DownloadLink = z.infer<typeof downloadLinkResponse>;
