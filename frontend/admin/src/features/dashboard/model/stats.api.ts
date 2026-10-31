import { queryOptions } from '@tanstack/react-query';
import type { Stats } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const statsApi = {
  get: (from?: string, to?: string) => api.get<Stats>('/admin/stats', { from, to }),
};

export const statsQueries = {
  get: (from?: string, to?: string) =>
    queryOptions({ queryKey: ['stats', from, to], queryFn: () => statsApi.get(from, to), refetchInterval: 60_000 }),
};
