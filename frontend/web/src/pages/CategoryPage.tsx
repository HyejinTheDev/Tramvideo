import { useParams } from 'react-router-dom';
import { VideoListView } from '@/features/videos/views/VideoListView';

export default function CategoryPage() {
  const { slug } = useParams();
  return <VideoListView key={slug} category={slug} />;
}
