import { Link } from 'react-router-dom';
import { Button, Card, Spinner } from '@tram/ui';
import { EmptyState, Pagination } from '@/components/common';
import { DownloadButton } from '../../downloads/views/DownloadButton';
import { usePurchasedViewModel } from '../view-models/usePurchasedViewModel';

export function PurchasedView() {
  const vm = usePurchasedViewModel();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Video đã mua</h1>
      {vm.isLoading ? (
        <Spinner />
      ) : vm.isEmpty ? (
        <EmptyState text="Bạn chưa mua video nào" action={<Link to="/"><Button>Khám phá video</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {vm.orders.map((o) => (
            <Card key={o.id} className="flex items-center gap-4 p-3">
              <Link to={`/video/${o.videoSlug}`} className="h-24 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {o.thumbnailUrl ? (
                  <img src={o.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">🎞️</div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/video/${o.videoSlug}`} className="line-clamp-2 font-medium hover:underline">
                  {o.videoTitle}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {o.priceText} · mua ngày {o.dateText}
                </p>
              </div>
              <DownloadButton videoId={o.videoId} size="sm" />
            </Card>
          ))}
        </div>
      )}
      <Pagination {...vm} />
    </div>
  );
}
