import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatVnd, type AdminOrder } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { orderQueries, ordersApi } from '../model/order.api';

export function useOrdersViewModel() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'' | 'COMPLETED' | 'REFUNDED'>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(orderQueries.list({ status: status || undefined, page }));
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  const refund = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => ordersApi.refund(id, { note }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return {
    isLoading,
    total,
    status,
    rows: (data?.items ?? []).map((o) => ({
      ...o,
      priceText: formatVnd(o.price),
      timeText: new Date(o.createdAt).toLocaleString('vi-VN'),
      canRefund: o.status === 'COMPLETED',
    })),
    errorMessage: refund.error ? toMessage(refund.error) : null,
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
    onStatusChange: (s: '' | 'COMPLETED' | 'REFUNDED') => {
      setStatus(s);
      setPage(1);
    },
    onRefund: (o: AdminOrder) => {
      const note = window.prompt(`Hoàn ${formatVnd(o.price)} cho ${o.userEmail}?\nNhập lý do (bắt buộc):`);
      if (note && note.trim().length >= 3) refund.mutate({ id: o.id, note: note.trim() });
    },
  };
}
