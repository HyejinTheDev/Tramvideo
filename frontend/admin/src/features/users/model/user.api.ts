import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AdminUser, AdminUsersQuery, Wallet, WalletAdjustmentInput } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const usersApi = {
  list: (q: Partial<AdminUsersQuery>) => api.getPage<AdminUser>('/admin/users', q),
  lock: (id: string) => api.post(`/admin/users/${id}/lock`),
  unlock: (id: string) => api.post(`/admin/users/${id}/unlock`),
  adjustWallet: (id: string, input: WalletAdjustmentInput) =>
    api.post<Wallet>(`/admin/users/${id}/wallet-adjustments`, input),
};

export const userQueries = {
  list: (q: Partial<AdminUsersQuery>) =>
    queryOptions({ queryKey: ['users', q], queryFn: () => usersApi.list(q), placeholderData: keepPreviousData }),
};
