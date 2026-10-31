import { useSearchParams } from 'react-router-dom';
import { VerifyEmailView } from '@/features/auth/views/AuthViews';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  return <VerifyEmailView token={params.get('token')} />;
}
