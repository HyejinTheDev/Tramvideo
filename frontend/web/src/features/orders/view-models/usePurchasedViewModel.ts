import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatVnd } from '@tram/shared';
import { orderQueries } from '../model/order.api';

export function usePurchasedViewModel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(orderQueries.mine(page));
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return {
    isLoading,
    isEmpty: !isLoading && total === 0,
    orders: (data?.items ?? []).map((o) => ({
      ...o,
      priceText: formatVnd(o.price),
      dateText: new Date(o.createdAt).toLocaleDateString('vi-VN'),
    })),
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
  };
}
