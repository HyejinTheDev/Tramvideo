import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';

export const idSchema = z.string().min(1).max(64);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

/** Chuẩn response thành công: { data, meta? } */
export interface ApiResponse<T> {
  data: T;
  meta?: PageMeta;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
