import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './guards/RequireAuth';
import { PublicLayout } from './layouts/PublicLayout';
import HomePage from '@/pages/HomePage';
import LegalPage from '@/pages/LegalPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Tách bundle theo trang để tải trang chủ nhanh hơn.
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const VideoDetailPage = lazy(() => import('@/pages/VideoDetailPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const TopUpPage = lazy(() => import('@/pages/TopUpPage'));
const PurchasedPage = lazy(() => import('@/pages/PurchasedPage'));
const WalletHistoryPage = lazy(() => import('@/pages/WalletHistoryPage'));

const auth = (el: React.ReactNode) => <RequireAuth>{el}</RequireAuth>;

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/danh-muc/:slug', element: <CategoryPage /> },
      { path: '/video/:slug', element: <VideoDetailPage /> },
      { path: '/tim-kiem', element: <SearchPage /> },
      { path: '/dang-nhap', element: <LoginPage /> },
      { path: '/dang-ky', element: <RegisterPage /> },
      { path: '/quen-mat-khau', element: <ForgotPasswordPage /> },
      { path: '/dat-lai-mat-khau', element: <ResetPasswordPage /> },
      { path: '/xac-thuc-email', element: <VerifyEmailPage /> },
      { path: '/tai-khoan', element: auth(<AccountPage />) },
      { path: '/nap-tien', element: auth(<TopUpPage />) },
      { path: '/da-mua', element: auth(<PurchasedPage />) },
      { path: '/lich-su', element: auth(<WalletHistoryPage />) },
      { path: '/dieu-khoan', element: <LegalPage slug="dieu-khoan" /> },
      { path: '/chinh-sach-bao-mat', element: <LegalPage slug="chinh-sach-bao-mat" /> },
      { path: '/chinh-sach-hoan-tien', element: <LegalPage slug="chinh-sach-hoan-tien" /> },
      { path: '/lien-he', element: <LegalPage slug="lien-he" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
