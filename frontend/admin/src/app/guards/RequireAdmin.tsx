import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@tram/ui';
import { authQueries } from '@/features/auth/model/auth.api';
import { AdminLoginView } from '@/features/auth/views/AdminLoginView';

/** Chỉ ADMIN vào được. Đây chỉ là UX – API kiểm tra quyền ở mọi endpoint /admin/*. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useQuery(authQueries.me());
  if (isLoading) return <Spinner className="py-32" />;
  if (!me) return <Navigate to="/dang-nhap" replace />;
  if (me.role !== 'ADMIN') return <AdminLoginView notice="Tài khoản này không có quyền quản trị." />;
  return <>{children}</>;
}
