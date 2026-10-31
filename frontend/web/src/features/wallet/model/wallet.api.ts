import { queryOptions } from '@tanstack/react-query';
import type { CreateTopUpInput, TopUp, Wallet, WalletTransaction } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const walletApi = {
  me: () => api.get<Wallet>('/wallet'),
  transactions: (page: number) => api.getPage<WalletTransaction>('/wallet/transactions', { page }),
  createTopUp: (input: CreateTopUpInput) => api.post<TopUp>('/wallet/top-ups', input),
  topUp: (id: string) => api.get<TopUp>(`/wallet/top-ups/${id}`),
};

export const walletQueries = {
  me: (enabled = true) =>
    queryOptions({ queryKey: ['wallet', 'me'], queryFn: walletApi.me, enabled }),
  transactions: (page: number) =>
    queryOptions({
      queryKey: ['wallet', 'transactions', page],
      queryFn: () => walletApi.transactions(page),
    }),
  /** FE gọi định kỳ 3 giây/lần cho tới khi COMPLETED hoặc EXPIRED. */
  topUp: (id: string | null) =>
    queryOptions({
      queryKey: ['wallet', 'top-up', id],
      queryFn: () => walletApi.topUp(id!),
      enabled: !!id,
      refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 3000 : false),
    }),
};
