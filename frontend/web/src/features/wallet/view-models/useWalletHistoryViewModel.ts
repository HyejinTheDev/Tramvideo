import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatVnd, type LedgerType } from '@tram/shared';
import { walletQueries } from '../model/wallet.api';

const TYPE_LABEL: Record<LedgerType, string> = {
  TOPUP: 'Nạp xu',
  PURCHASE: 'Mua video',
  REFUND: 'Hoàn xu',
  ADJUSTMENT: 'Điều chỉnh',
};

export function useWalletHistoryViewModel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(walletQueries.transactions(page));
  const wallet = useQuery(walletQueries.me());
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return {
    isLoading,
    balanceText: wallet.data ? formatVnd(wallet.data.balance) : '',
    rows: (data?.items ?? []).map((t) => ({
      id: t.id,
      typeLabel: TYPE_LABEL[t.type],
      amountText: (t.amount > 0 ? '+' : '') + formatVnd(t.amount),
      isCredit: t.amount > 0,
      balanceAfterText: formatVnd(t.balanceAfter),
      note: t.note,
      timeText: new Date(t.createdAt).toLocaleString('vi-VN'),
    })),
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
  };
}
