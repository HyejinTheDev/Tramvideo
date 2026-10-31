import { queryOptions } from '@tanstack/react-query';
import type { Category, UpsertCategoryInput } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const categoriesApi = {
  list: () => api.get<Category[]>('/admin/categories'),
  create: (input: UpsertCategoryInput) => api.post<Category>('/admin/categories', input),
  update: (id: string, input: UpsertCategoryInput) => api.patch<Category>(`/admin/categories/${id}`, input),
  remove: (id: string) => api.delete(`/admin/categories/${id}`),
};

export const categoryQueries = {
  list: () => queryOptions({ queryKey: ['categories'], queryFn: categoriesApi.list }),
};
