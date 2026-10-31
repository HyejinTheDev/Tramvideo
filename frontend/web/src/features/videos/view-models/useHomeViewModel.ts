import { useQuery } from '@tanstack/react-query';
import { videoQueries } from '../model/video.queries';

export function useHomeViewModel() {
  const newest = useQuery(videoQueries.list({ sort: 'newest', pageSize: 8 }));
  const bestselling = useQuery(videoQueries.list({ sort: 'bestselling', pageSize: 8 }));
  const categories = useQuery(videoQueries.categories());

  return {
    isLoading: newest.isLoading || bestselling.isLoading,
    newest: newest.data?.items ?? [],
    bestselling: bestselling.data?.items ?? [],
    categories: categories.data ?? [],
  };
}
