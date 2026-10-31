import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toMessage } from '@/lib/errorMessages';
import { authApi } from '../model/auth.api';
import { useCurrentUser } from './useCurrentUser';

export function useAccountViewModel() {
  const { me, balanceText } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const resend = useMutation({ mutationFn: authApi.resendVerify });
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['wallet'] });
      queryClient.removeQueries({ queryKey: ['orders'] });
      navigate('/', { replace: true });
    },
  });

  return {
    me,
    balanceText,
    needsVerify: !!me && !me.emailVerified,
    isResending: resend.isPending,
    resendDone: resend.isSuccess,
    resendError: resend.error ? toMessage(resend.error) : null,
    onResendVerify: () => resend.mutate(),
    onLogout: () => logout.mutate(),
  };
}
