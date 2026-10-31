import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { authApi, authQueries } from '../model/auth.api';

export function useAdminLoginViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (me) => {
      queryClient.setQueryData(['auth', 'me'], me);
      navigate('/', { replace: true });
    },
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: login.isPending,
    errorMessage: login.error ? toMessage(login.error) : null,
    onSubmit: form.handleSubmit((v) => login.mutate(v)),
  };
}

/** Khung trang admin: người đang đăng nhập + đăng xuất. */
export function useAdminShellViewModel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useQuery(authQueries.me());
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      navigate('/dang-nhap', { replace: true });
    },
  });
  return { email: me?.email ?? '', onLogout: () => logout.mutate() };
}
