import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { TOPUP_MAX_AMOUNT, TOPUP_MIN_AMOUNT, TOPUP_PRESETS, formatVnd } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { walletApi, walletQueries } from '../model/wallet.api';

/** Màn nạp xu: chọn số xu → hiện QR → tự kiểm tra cho tới khi nhận được tiền. */
export function useTopUpViewModel() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const back = params.get('tu');
  const [amount, setAmount] = useState<number>(TOPUP_PRESETS[1]);
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const create = useMutation({
    mutationFn: walletApi.createTopUp,
    onSuccess: (t) => setTopUpId(t.id),
  });
  const { data: topUp } = useQuery(walletQueries.topUp(topUpId));

  useEffect(() => {
    if (topUp?.status === 'COMPLETED') {
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    }
  }, [topUp?.status, queryClient]);

  useEffect(() => {
    if (!topUpId) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [topUpId]);

  const remainingSec = topUp ? Math.max(0, Math.floor((new Date(topUp.expiresAt).getTime() - now) / 1000)) : 0;
  const validAmount = Number.isInteger(amount) && amount >= TOPUP_MIN_AMOUNT && amount <= TOPUP_MAX_AMOUNT;

  return {
    presets: TOPUP_PRESETS.map((v) => ({ value: v, label: formatVnd(v) })),
    amount,
    amountText: formatVnd(amount),
    validAmount,
    minText: formatVnd(TOPUP_MIN_AMOUNT),
    isCreating: create.isPending,
    createError: create.error ? toMessage(create.error) : null,
    topUp,
    status: topUp?.status ?? null,
    countdownText: `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')}`,
    backUrl: back && back.startsWith('/') && !back.startsWith('//') ? back : null,
    onAmountChange: (v: number) => setAmount(v),
    onCreate: () => validAmount && create.mutate({ amount }),
    onReset: () => {
      setTopUpId(null);
      create.reset();
    },
    copy: (text: string) => void navigator.clipboard.writeText(text),
  };
}
