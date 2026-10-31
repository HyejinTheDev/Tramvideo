import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatVnd, type AdminUser } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { userQueries, usersApi } from '../model/user.api';

export function useUsersViewModel() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(userQueries.list({ q: search || undefined, page }));
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const toggleLock = useMutation({
    mutationFn: (u: AdminUser) => (u.status === 'LOCKED' ? usersApi.unlock(u.id) : usersApi.lock(u.id)),
    onSuccess: () => void invalidate(),
  });
  const adjust = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      usersApi.adjustWallet(id, { amount, note }),
    onSuccess: () => void invalidate(),
  });

  const error = toggleLock.error ?? adjust.error;

  return {
    isLoading,
    total,
    q,
    rows: (data?.items ?? []).map((u) => ({
      ...u,
      balanceText: formatVnd(u.balance),
      dateText: new Date(u.createdAt).toLocaleDateString('vi-VN'),
      isLocked: u.status === 'LOCKED',
    })),
    errorMessage: error ? toMessage(error) : null,
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
    onQChange: setQ,
    onSearch: (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(q.trim());
      setPage(1);
    },
    onToggleLock: (u: AdminUser) => {
      const action = u.status === 'LOCKED' ? 'Mở khoá' : 'Khoá';
      if (window.confirm(`${action} tài khoản ${u.email}?`)) toggleLock.mutate(u);
    },
    onAdjust: (u: AdminUser) => {
      const raw = window.prompt(`Điều chỉnh xu cho ${u.email} (số dư ${formatVnd(u.balance)}).\nNhập số xu (âm để trừ), ví dụ 20000 hoặc -5000:`);
      const amount = Number(raw);
      if (!raw || !Number.isInteger(amount) || amount === 0) return;
      const note = window.prompt('Lý do điều chỉnh (bắt buộc):');
      if (note && note.trim().length >= 3) adjust.mutate({ id: u.id, amount, note: note.trim() });
    },
  };
}
