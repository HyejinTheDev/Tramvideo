import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { ListVideosQuery } from '@tram/shared';
import { videosApi } from './video.api';

export const videoQueries = {
  list: (q: Partial<ListVideosQuery>) =>
    queryOptions({
      queryKey: ['videos', 'list', q],
      queryFn: () => videosApi.list(q),
      placeholderData: keepPreviousData,
    }),
  detail: (slug: string) =>
    queryOptions({ queryKey: ['videos', 'detail', slug], queryFn: () => videosApi.detail(slug) }),
  categories: () =>
    queryOptions({
      queryKey: ['categories'],
      queryFn: videosApi.categories,
      staleTime: 10 * 60_000,
    }),
};
