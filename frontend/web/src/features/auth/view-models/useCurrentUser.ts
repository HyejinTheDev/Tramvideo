import { useQuery } from '@tanstack/react-query';
import { formatVnd } from '@tram/shared';
import { authQueries } from '../model/auth.api';
import { walletQueries } from '../../wallet/model/wallet.api';

/** Người dùng hiện tại + số dư xu (dùng ở Header, trang chi tiết...). */
export function useCurrentUser() {
  const meQuery = useQuery(authQueries.me());
  const me = meQuery.data ?? null;
  const walletQuery = useQuery(walletQueries.me(!!me));
  return {
    me,
    isLoggedIn: !!me,
    isLoading: meQuery.isLoading,
    balance: walletQuery.data?.balance ?? null,
    balanceText: walletQuery.data ? formatVnd(walletQuery.data.balance) : '',
  };
}
