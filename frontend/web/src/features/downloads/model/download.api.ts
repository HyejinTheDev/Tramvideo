import type { DownloadLink } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const downloadsApi = {
  issue: (videoId: string) => api.post<DownloadLink>(`/downloads/${videoId}`),
};
