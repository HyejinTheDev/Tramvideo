import { useSearchParams } from 'react-router-dom';
import { VideoListView } from '@/features/videos/views/VideoListView';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? undefined;
  return <VideoListView key={q} q={q} />;
}
