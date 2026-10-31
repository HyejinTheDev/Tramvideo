import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type {
  AdminListVideosQuery,
  AdminVideo,
  CompleteUploadInput,
  CreateVideoInput,
  RequestUploadUrlInput,
  UpdateVideoInput,
  UploadUrl,
} from '@tram/shared';
import { api } from '@/lib/apiClient';

export const videosApi = {
  list: (q: Partial<AdminListVideosQuery>) => api.getPage<AdminVideo>('/admin/videos', q),
  get: (id: string) => api.get<AdminVideo>(`/admin/videos/${id}`),
  create: (input: CreateVideoInput) => api.post<{ id: string }>('/admin/videos', input),
  update: (id: string, input: UpdateVideoInput) => api.patch<AdminVideo>(`/admin/videos/${id}`, input),
  uploadUrl: (id: string, input: RequestUploadUrlInput) =>
    api.post<UploadUrl>(`/admin/videos/${id}/upload-url`, input),
  uploadComplete: (id: string, input: CompleteUploadInput) =>
    api.post<AdminVideo>(`/admin/videos/${id}/upload-complete`, input),
  publish: (id: string) => api.post<AdminVideo>(`/admin/videos/${id}/publish`),
  hide: (id: string) => api.post<AdminVideo>(`/admin/videos/${id}/hide`),
};

export const videoQueries = {
  list: (q: Partial<AdminListVideosQuery>) =>
    queryOptions({ queryKey: ['videos', 'list', q], queryFn: () => videosApi.list(q), placeholderData: keepPreviousData }),
  one: (id: string) => queryOptions({ queryKey: ['videos', 'one', id], queryFn: () => videosApi.get(id) }),
};
