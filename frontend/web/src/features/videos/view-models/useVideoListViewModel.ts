import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE, videoSortSchema, type VideoSort } from '@tram/shared';
import { videoQueries } from '../model/video.queries';

export const SORT_OPTIONS: { value: VideoSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestselling', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

/** Danh sách video theo danh mục / từ khoá; sort + page nằm trên URL để chia sẻ được. */
export function useVideoListViewModel(opts: { category?: string; q?: string }) {
  const [params, setParams] = useSearchParams();
  const sortParam = videoSortSchema.safeParse(params.get('sap-xep'));
  const sort: VideoSort = sortParam.success ? sortParam.data : 'newest';
  const page = Math.max(1, Number(params.get('trang')) || 1);

  const listQuery = useQuery(
    videoQueries.list({ category: opts.category, q: opts.q, sort, page, pageSize: DEFAULT_PAGE_SIZE }),
  );
  const categoriesQuery = useQuery(videoQueries.categories());

  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const category = categoriesQuery.data?.find((c) => c.slug === opts.category);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return {
    title: opts.q ? `Kết quả cho “${opts.q}”` : (category?.name ?? 'Tất cả video'),
    videos: listQuery.data?.items ?? [],
    total,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    isFetching: listQuery.isFetching,
    sort,
    sortOptions: SORT_OPTIONS,
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onSortChange: (s: VideoSort) => update({ 'sap-xep': s, trang: null }),
    onPrev: () => update({ trang: String(page - 1) }),
    onNext: () => update({ trang: String(page + 1) }),
  };
}
