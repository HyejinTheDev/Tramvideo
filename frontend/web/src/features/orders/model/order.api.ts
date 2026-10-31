import { queryOptions } from '@tanstack/react-query';
import type { Order, Ownership, PurchaseVideoInput } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const ordersApi = {
  purchase: (input: PurchaseVideoInput) =>
    api.post<{ orderId: string; balance: number }>('/orders', input),
  mine: (page: number) => api.getPage<Order>('/orders', { page }),
  owns: (videoId: string) => api.get<Ownership>(`/orders/owns/${videoId}`),
};

export const orderQueries = {
  mine: (page: number) =>
    queryOptions({ queryKey: ['orders', 'mine', page], queryFn: () => ordersApi.mine(page) }),
  owns: (videoId: string | undefined, enabled: boolean) =>
    queryOptions({
      queryKey: ['orders', 'owns', videoId],
      queryFn: () => ordersApi.owns(videoId!),
      enabled: !!videoId && enabled,
    }),
};
