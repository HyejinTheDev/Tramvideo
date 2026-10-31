import { Link } from 'react-router-dom';
import { Badge, Button, Input, Select, Spinner, Table, Td, Th } from '@tram/ui';
import type { VideoStatus } from '@tram/shared';
import { EmptyState, Pagination } from '@/components/common';
import { useVideoListViewModel } from '../view-models/useVideoListViewModel';

const STATUS_VARIANT = { DRAFT: 'warning', PUBLISHED: 'success', HIDDEN: 'secondary' } as const;

export function VideoListView() {
  const vm = useVideoListViewModel();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Video ({vm.total})</h1>
        <Link to="/videos/moi"><Button>+ Thêm video</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <form onSubmit={vm.onSearch} className="flex gap-2">
          <Input placeholder="Tìm theo tiêu đề..." value={vm.q} onChange={(e) => vm.onQChange(e.target.value)} className="w-64" />
          <Button type="submit" variant="outline">Tìm</Button>
        </form>
        <Select value={vm.status} onChange={(e) => vm.onStatusChange(e.target.value as VideoStatus | '')} className="w-40">
          <option value="">Mọi trạng thái</option>
          {vm.statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Chưa có video" />
      ) : (
        <Table className={vm.isFetching ? 'opacity-60' : ''}>
          <thead>
            <tr><Th /><Th>Tiêu đề</Th><Th>Danh mục</Th><Th>Giá</Th><Th>File</Th><Th>Đã bán</Th><Th>Trạng thái</Th></tr>
          </thead>
          <tbody>
            {vm.rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <Td className="w-12">
                  {r.thumbnailUrl ? <img src={r.thumbnailUrl} alt="" className="h-14 w-8 rounded object-cover" /> : '🎞️'}
                </Td>
                <Td><Link to={`/videos/${r.id}`} className="font-medium hover:underline">{r.title}</Link><div className="text-xs text-muted-foreground">{r.durationText}</div></Td>
                <Td>{r.categoryName}</Td>
                <Td className="whitespace-nowrap">{r.priceText}</Td>
                <Td className="text-xs text-muted-foreground">{r.filesText}</Td>
                <Td>{r.purchaseCount}</Td>
                <Td><Badge variant={STATUS_VARIANT[r.status]}>{r.statusLabel}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination {...vm} />
    </div>
  );
}
