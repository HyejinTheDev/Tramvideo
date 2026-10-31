import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Spinner } from '@tram/ui';
import { EmptyState } from '@/components/common';
import { DownloadButton } from '../../downloads/views/DownloadButton';
import { useVideoDetailViewModel } from '../view-models/useVideoDetailViewModel';
import { PriceTag, VideoPlayer } from './components/VideoCard';

export function VideoDetailView({ slug }: { slug: string }) {
  const vm = useVideoDetailViewModel(slug);
  if (vm.isLoading) return <Spinner />;
  if (vm.notFound || !vm.video) {
    return <EmptyState text="Không tìm thấy video" action={<Link to="/"><Button>Về trang chủ</Button></Link>} />;
  }
  const v = vm.video;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <VideoPlayer src={v.previewUrl} poster={v.thumbnailUrl} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Bản xem thử có watermark. File gốc chất lượng cao, không watermark sau khi mua.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Link to={`/danh-muc/${v.categorySlug}`}>
            <Badge variant="secondary">{v.categoryName}</Badge>
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{v.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thời lượng {vm.durationText}
            {v.width && v.height ? ` · ${v.width}×${v.height}` : ''}
            {v.purchaseCount > 0 ? ` · ${v.purchaseCount} lượt mua` : ''}
          </p>
        </div>

        <PriceTag text={vm.priceText} className="text-3xl" />

        {vm.isOwned ? (
          <div className="space-y-2">
            <Alert variant="success">✅ Bạn đã sở hữu video này.</Alert>
            <DownloadButton videoId={v.id} />
          </div>
        ) : (
          <div className="space-y-2">
            <Button size="lg" className="w-full md:w-auto" disabled={vm.isPurchasing} onClick={vm.onPurchase}>
              {vm.isPurchasing
                ? 'Đang xử lý...'
                : !vm.isLoggedIn
                  ? 'Đăng nhập để mua'
                  : vm.canAfford
                    ? `Mua ngay – ${vm.priceText}`
                    : 'Không đủ xu – Nạp thêm'}
            </Button>
            {vm.isLoggedIn && <p className="text-sm text-muted-foreground">Số dư: {vm.balanceText}</p>}
          </div>
        )}

        {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}

        <Button variant="outline" size="sm" onClick={vm.onShare}>
          {vm.copied ? '✓ Đã sao chép link' : '🔗 Chia sẻ'}
        </Button>

        {v.description && <p className="whitespace-pre-line text-sm leading-relaxed">{v.description}</p>}

        {v.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {v.tags.map((t) => (
              <Badge key={t} variant="outline">#{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
