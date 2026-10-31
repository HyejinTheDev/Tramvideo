import { Button } from '@tram/ui';
import { useDownloadViewModel } from '../view-models/useDownloadViewModel';

export function DownloadButton({ videoId, size = 'lg' }: { videoId: string; size?: 'sm' | 'lg' }) {
  const vm = useDownloadViewModel(videoId);
  return (
    <div className="space-y-1">
      <Button size={size} onClick={vm.onDownload} disabled={vm.isPreparing}>
        {vm.isPreparing ? 'Đang chuẩn bị...' : '⬇️ Tải về'}
      </Button>
      {vm.errorMessage && <p className="text-sm text-destructive">{vm.errorMessage}</p>}
    </div>
  );
}
