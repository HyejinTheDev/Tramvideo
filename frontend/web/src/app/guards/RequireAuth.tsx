import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@tram/ui';
import { authQueries } from '@/features/auth/model/auth.api';

/** Chặn trang cần đăng nhập. Chỉ là UX: quyền thật được kiểm tra ở API. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: me, isLoading } = useQuery(authQueries.me());
  if (isLoading) return <Spinner />;
  if (!me) {
    const from = location.pathname + location.search;
    return <Navigate to={`/dang-nhap?tu=${encodeURIComponent(from)}`} replace />;
  }
  return <>{children}</>;
}
