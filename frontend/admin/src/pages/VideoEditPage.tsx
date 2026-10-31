import { useParams } from 'react-router-dom';
import { VideoFormView } from '@/features/videos/views/VideoFormView';

export default function VideoEditPage() {
  const { id } = useParams();
  return <VideoFormView key={id} id={id!} />;
}
