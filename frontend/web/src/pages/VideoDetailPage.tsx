import { useParams } from 'react-router-dom';
import { VideoDetailView } from '@/features/videos/views/VideoDetailView';

export default function VideoDetailPage() {
  const { slug } = useParams();
  return <VideoDetailView key={slug} slug={slug!} />;
}
