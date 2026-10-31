import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
} from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { authApi } from '../model/auth.api';

/** Sau đăng nhập quay lại trang đang xem (chỉ cho phép đường dẫn nội bộ). */
function useRedirectTarget() {
  const [params] = useSearchParams();
  const from = params.get('tu') ?? '/';
  return from.startsWith('/') && !from.startsWith('//') ? from : '/';
}

export function useLoginViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const target = useRedirectTarget();
  const [params] = useSearchParams();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (me) => {
      queryClient.setQueryData(['auth', 'me'], me);
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      navigate(target, { replace: true });
    },
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: login.isPending,
    errorMessage: login.error
      ? toMessage(login.error)
      : params.get('loi') === 'google'
        ? 'Đăng nhập Google thất bại, vui lòng thử lại'
        : null,
    googleUrl: authApi.googleUrl(),
    onSubmit: form.handleSubmit((v) => login.mutate(v)),
  };
}

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });
type RegisterForm = z.infer<typeof registerFormSchema>;

export function useRegisterViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const target = useRedirectTarget();
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerFormSchema) });

  const signup = useMutation({
    mutationFn: (v: RegisterInput) => authApi.register(v),
    onSuccess: async (me) => {
      queryClient.setQueryData(['auth', 'me'], me);
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      navigate(target, { replace: true });
    },
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: signup.isPending,
    errorMessage: signup.error ? toMessage(signup.error) : null,
    googleUrl: authApi.googleUrl(),
    onSubmit: form.handleSubmit(({ confirmPassword: _c, ...v }) => signup.mutate(v)),
  };
}

export function useForgotPasswordViewModel() {
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const send = useMutation({ mutationFn: authApi.forgotPassword });
  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: send.isPending,
    isSent: send.isSuccess,
    errorMessage: send.error ? toMessage(send.error) : null,
    onSubmit: form.handleSubmit((v) => send.mutate(v)),
  };
}

const resetFormSchema = resetPasswordSchema
  .omit({ token: true })
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });
type ResetForm = z.infer<typeof resetFormSchema>;

export function useResetPasswordViewModel(token: string | null) {
  const form = useForm<ResetForm>({ resolver: zodResolver(resetFormSchema) });
  const reset = useMutation({ mutationFn: authApi.resetPassword });
  return {
    hasToken: !!token,
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: reset.isPending,
    isDone: reset.isSuccess,
    errorMessage: reset.error ? toMessage(reset.error) : null,
    onSubmit: form.handleSubmit((v) => token && reset.mutate({ token, password: v.password })),
  };
}

export function useVerifyEmailViewModel(token: string | null) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState<string | null>(token ? null : 'Thiếu mã xác thực');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // token chỉ dùng được 1 lần → không gọi 2 lần (StrictMode)
    authApi
      .verifyEmail(token)
      .then(() => {
        setState('ok');
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      })
      .catch((e: unknown) => {
        setState('error');
        setMessage(toMessage(e));
      });
  }, [token, queryClient]);

  return { state, message };
}
