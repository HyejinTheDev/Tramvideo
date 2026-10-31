import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AdminOrder, AdminOrdersQuery, RefundOrderInput } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const ordersApi = {
  list: (q: Partial<AdminOrdersQuery>) => api.getPage<AdminOrder>('/admin/orders', q),
  refund: (id: string, input: RefundOrderInput) => api.post(`/admin/orders/${id}/refund`, input),
};

export const orderQueries = {
  list: (q: Partial<AdminOrdersQuery>) =>
    queryOptions({ queryKey: ['orders', q], queryFn: () => ordersApi.list(q), placeholderData: keepPreviousData }),
};
