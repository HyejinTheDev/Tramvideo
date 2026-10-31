import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, formatDuration, formatVnd, type VideoStatus } from '@tram/shared';
import { videoQueries } from '../model/video.api';

export const STATUS_LABEL: Record<VideoStatus, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đang bán',
  HIDDEN: 'Đã ẩn',
};

export function useVideoListViewModel() {
  const [status, setStatus] = useState<VideoStatus | ''>('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useQuery(
    videoQueries.list({ status: status || undefined, q: search || undefined, page }),
  );
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return {
    isLoading,
    isFetching,
    total,
    status,
    q,
    statusOptions: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
    rows: (data?.items ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      categoryName: v.categoryName,
      status: v.status,
      statusLabel: STATUS_LABEL[v.status],
      priceText: formatVnd(v.price),
      durationText: formatDuration(v.durationSec),
      purchaseCount: v.purchaseCount,
      filesText: [v.hasOriginal && 'gốc', v.hasPreview && 'preview', v.hasThumbnail && 'ảnh'].filter(Boolean).join(', ') || 'chưa có',
    })),
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
    onStatusChange: (s: VideoStatus | '') => {
      setStatus(s);
      setPage(1);
    },
    onQChange: setQ,
    onSearch: (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(q.trim());
      setPage(1);
    },
  };
}
