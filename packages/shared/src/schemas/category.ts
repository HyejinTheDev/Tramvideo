import { z } from 'zod';

export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số, gạch ngang')
  .max(200);

export const categoryResponse = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number().int(),
});
export type Category = z.infer<typeof categoryResponse>;

export const upsertCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema.optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
