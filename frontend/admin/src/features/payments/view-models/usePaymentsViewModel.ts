import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatVnd, type PaymentEvent, type PaymentEventStatus } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { userQueries } from '../../users/model/user.api';
import { paymentQueries, paymentsApi } from '../model/payment.api';

export const PAYMENT_STATUS_LABEL: Record<PaymentEventStatus, string> = {
  MATCHED: 'Tự khớp',
  UNMATCHED: 'Chưa khớp',
  RESOLVED: 'Đã xử lý tay',
  IGNORED: 'Bỏ qua',
};

/** Đối soát khoản nạp: khoản chưa khớp → cộng cho đúng người (theo số thực nhận) hoặc bỏ qua. */
export function usePaymentsViewModel() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentEventStatus | ''>('UNMATCHED');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<PaymentEvent | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery(paymentQueries.list({ status: status || undefined, page }));
  const users = useQuery({ ...userQueries.list({ q: userSearch, page: 1, pageSize: 5 }), enabled: userSearch.trim().length >= 3 });
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  const resolve = useMutation({
    mutationFn: (input: Parameters<typeof paymentsApi.resolve>[1]) => paymentsApi.resolve(resolving!.id, input),
    onSuccess: () => {
      setResolving(null);
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return {
    isLoading,
    total,
    status,
    statusOptions: Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
    rows: (data?.items ?? []).map((p) => ({
      ...p,
      amountText: formatVnd(p.amount).replace(' xu', 'đ'),
      timeText: new Date(p.transferredAt).toLocaleString('vi-VN'),
      statusLabel: PAYMENT_STATUS_LABEL[p.status],
      canResolve: p.status === 'UNMATCHED',
    })),
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
    onStatusChange: (s: PaymentEventStatus | '') => {
      setStatus(s);
      setPage(1);
    },

    // --- Hộp xử lý ---
    resolving,
    userSearch,
    userOptions: users.data?.items ?? [],
    selectedUserId,
    amount,
    note,
    isSubmitting: resolve.isPending,
    resolveError: resolve.error ? toMessage(resolve.error) : null,
    canCredit: !!selectedUserId && amount > 0 && note.trim().length > 0,
    onOpen: (p: PaymentEvent) => {
      resolve.reset();
      setResolving(p);
      setUserSearch('');
      setSelectedUserId(null);
      setAmount(p.amount);
      setNote(`Chuyển khoản sai nội dung: "${p.content}"`);
    },
    onClose: () => setResolving(null),
    onUserSearch: setUserSearch,
    onSelectUser: setSelectedUserId,
    onAmountChange: setAmount,
    onNoteChange: setNote,
    onCredit: () =>
      selectedUserId && resolve.mutate({ action: 'credit', userId: selectedUserId, amount, note: note.trim() }),
    onIgnore: () => note.trim() && resolve.mutate({ action: 'ignore', note: note.trim() }),
  };
}
