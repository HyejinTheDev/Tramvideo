import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';

const VideoListPage = lazy(() => import('@/pages/VideoListPage'));
const VideoCreatePage = lazy(() => import('@/pages/VideoCreatePage'));
const VideoEditPage = lazy(() => import('@/pages/VideoEditPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));

export const router = createBrowserRouter([
  { path: '/dang-nhap', element: <LoginPage /> },
  {
    element: <AdminLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/videos', element: <VideoListPage /> },
      { path: '/videos/moi', element: <VideoCreatePage /> },
      { path: '/videos/:id', element: <VideoEditPage /> },
      { path: '/danh-muc', element: <CategoriesPage /> },
      { path: '/don-hang', element: <OrdersPage /> },
      { path: '/nap-tien', element: <PaymentsPage /> },
      { path: '/nguoi-dung', element: <UsersPage /> },
      { path: '/nhat-ky', element: <AuditLogsPage /> },
      { path: '*', element: <DashboardPage /> },
    ],
  },
]);
