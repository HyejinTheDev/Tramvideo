import { Select } from '@tram/ui';
import type { VideoSort } from '@tram/shared';
import { Pagination } from '@/components/common';
import { useVideoListViewModel } from '../view-models/useVideoListViewModel';
import { VideoGrid } from './components/VideoCard';

export function VideoListView({ category, q }: { category?: string; q?: string }) {
  const vm = useVideoListViewModel({ category, q });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{vm.title}</h1>
          {!vm.isLoading && <p className="text-sm text-muted-foreground">{vm.total} video</p>}
        </div>
        <Select
          value={vm.sort}
          onChange={(e) => vm.onSortChange(e.target.value as VideoSort)}
          className="w-44"
          aria-label="Sắp xếp"
        >
          {vm.sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {vm.isError ? (
        <p className="text-destructive">Không tải được danh sách video.</p>
      ) : (
        <div className={vm.isFetching && !vm.isLoading ? 'opacity-60 transition-opacity' : ''}>
          <VideoGrid
            videos={vm.videos}
            isLoading={vm.isLoading}
            emptyText={q ? 'Không tìm thấy video phù hợp' : 'Chưa có video trong mục này'}
          />
        </div>
      )}

      <Pagination {...vm} />
    </div>
  );
}
