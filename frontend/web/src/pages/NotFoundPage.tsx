import { Link } from 'react-router-dom';
import { Button } from '@tram/ui';
import { EmptyState } from '@/components/common';

export default function NotFoundPage() {
  return <EmptyState text="Trang không tồn tại" action={<Link to="/"><Button>Về trang chủ</Button></Link>} />;
}
