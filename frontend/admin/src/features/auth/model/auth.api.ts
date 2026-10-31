import { queryOptions } from '@tanstack/react-query';
import type { LoginInput, Me } from '@tram/shared';
import { api, ApiError } from '@/lib/apiClient';

export const authApi = {
  login: (input: LoginInput) => api.post<Me>('/auth/login', input),
  logout: () => api.post('/auth/logout'),
};

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: async (): Promise<Me | null> => {
        try {
          return await api.get<Me>('/me');
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return null;
          throw e;
        }
      },
      staleTime: 5 * 60_000,
    }),
};
