import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Spinner } from '@tram/ui';
import { ErrorBoundary } from '@/components/common';
import { Sidebar } from '@/components/layout/Sidebar';
import { RequireAdmin } from '../guards/RequireAdmin';

export function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </RequireAdmin>
  );
}
