import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AdminPaymentsQuery, PaymentEvent, ResolvePaymentInput } from '@tram/shared';
import { api } from '@/lib/apiClient';

export const paymentsApi = {
  list: (q: Partial<AdminPaymentsQuery>) => api.getPage<PaymentEvent>('/admin/payments', q),
  resolve: (id: string, input: ResolvePaymentInput) => api.post(`/admin/payments/${id}/resolve`, input),
};

export const paymentQueries = {
  list: (q: Partial<AdminPaymentsQuery>) =>
    queryOptions({ queryKey: ['payments', q], queryFn: () => paymentsApi.list(q), placeholderData: keepPreviousData }),
};
