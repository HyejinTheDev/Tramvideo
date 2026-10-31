import { Link } from 'react-router-dom';
import { formatDuration, formatVnd, type VideoSummary } from '@tram/shared';
import { Spinner } from '@tram/ui';
import { EmptyState } from '@/components/common';

export function PriceTag({ text, className }: { text: string; className?: string }) {
  return <span className={`font-semibold text-primary ${className ?? ''}`}>{text}</span>;
}

export function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <Link to={`/video/${video.slug}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎞️</div>
        )}
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {formatDuration(video.durationSec)}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{video.title}</h3>
      <div className="mt-1 flex items-center justify-between text-sm">
        <PriceTag text={formatVnd(video.price)} />
        {video.purchaseCount > 0 && (
          <span className="text-xs text-muted-foreground">{video.purchaseCount} lượt mua</span>
        )}
      </div>
    </Link>
  );
}

export function VideoGrid({
  videos,
  isLoading,
  emptyText = 'Chưa có video nào',
}: {
  videos: VideoSummary[];
  isLoading?: boolean;
  emptyText?: string;
}) {
  if (isLoading) return <Spinner />;
  if (!videos.length) return <EmptyState text={emptyText} />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

export function VideoPlayer({ src, poster }: { src: string | null; poster: string | null }) {
  if (!src) {
    return (
      <div className="flex aspect-[9/16] max-h-[70vh] items-center justify-center rounded-lg bg-muted text-muted-foreground">
        Chưa có video xem thử
      </div>
    );
  }
  return (
    <video
      src={src}
      poster={poster ?? undefined}
      controls
      playsInline
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      className="aspect-[9/16] max-h-[70vh] w-full rounded-lg bg-black object-contain"
    />
  );
}
