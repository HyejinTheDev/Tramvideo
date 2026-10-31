import { useSearchParams } from 'react-router-dom';
import { ResetPasswordView } from '@/features/auth/views/AuthViews';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  return <ResetPasswordView token={params.get('token')} />;
}
