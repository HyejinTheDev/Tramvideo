import type { Category, ListVideosQuery, VideoDetail, VideoSummary } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const videosApi = {
  list: (q: Partial<ListVideosQuery>) => api.getPage<VideoSummary>('/videos', q),
  detail: (slug: string) => api.get<VideoDetail>(`/videos/${encodeURIComponent(slug)}`),
  categories: () => api.get<Category[]>('/categories'),
  shareUrl: (slug: string) =>
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1'}/share/videos/${encodeURIComponent(slug)}`,
};
