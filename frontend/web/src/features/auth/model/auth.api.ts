import { queryOptions } from '@tanstack/react-query';
import type {
  ForgotPasswordInput,
  LoginInput,
  Me,
  RegisterInput,
  ResetPasswordInput,
} from '@tram/shared';
import { api, ApiError } from '@/lib/apiClient';

export const authApi = {
  me: () => api.get<Me>('/me'),
  login: (input: LoginInput) => api.post<Me>('/auth/login', input),
  register: (input: RegisterInput) => api.post<Me>('/auth/register', input),
  logout: () => api.post<{ ok: boolean }>('/auth/logout'),
  verifyEmail: (token: string) => api.post<{ ok: boolean }>('/auth/verify-email', { token }),
  resendVerify: () => api.post<{ ok: boolean }>('/auth/resend-verify-email'),
  forgotPassword: (input: ForgotPasswordInput) => api.post<{ ok: boolean }>('/auth/forgot-password', input),
  resetPassword: (input: ResetPasswordInput) => api.post<{ ok: boolean }>('/auth/reset-password', input),
  googleUrl: () => `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1'}/auth/google`,
};

export const authQueries = {
  /** Người dùng hiện tại; null nếu chưa đăng nhập (không coi là lỗi). */
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: async (): Promise<Me | null> => {
        try {
          return await authApi.me();
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return null;
          throw e;
        }
      },
      staleTime: 5 * 60_000,
    }),
};
