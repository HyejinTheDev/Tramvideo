import type { AdminVideo } from '@tram/shared';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from '@tram/ui';
import { useVideoUploadViewModel } from '../view-models/useVideoUploadViewModel';

export function VideoUploadPanel({ video }: { video: AdminVideo }) {
  const vm = useVideoUploadViewModel(video);

  return (
    <Card>
      <CardHeader><CardTitle>File & đăng bán</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {vm.slots.map((s) => (
          <div key={s.kind} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.done ? '✅' : '⬜'} {s.label}</span>
              <label className="cursor-pointer text-sm text-primary hover:underline">
                {s.done ? 'Thay file' : 'Chọn file'}
                <input
                  type="file"
                  accept={s.accept}
                  className="hidden"
                  disabled={vm.isUploading}
                  onChange={(e) => {
                    vm.onFile(s.kind, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
            {s.busy && s.progress !== undefined && (
              <div className="h-2 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
              </div>
            )}
            {s.error && <p className="text-sm text-destructive">{s.error}</p>}
          </div>
        ))}

        {vm.thumbnailUrl && <img src={vm.thumbnailUrl} alt="Ảnh bìa" className="h-40 rounded border object-cover" />}

        {vm.actionError && <Alert variant="destructive">{vm.actionError}</Alert>}

        <div className="flex gap-2">
          <Button disabled={!vm.canPublish} onClick={vm.onPublish}>Đăng bán</Button>
          {vm.canHide && <Button variant="outline" onClick={vm.onHide}>Ẩn video</Button>}
        </div>
        {!vm.canPublish && vm.status !== 'PUBLISHED' && (
          <p className="text-xs text-muted-foreground">Cần đủ file gốc, preview và ảnh bìa để đăng.</p>
        )}
      </CardContent>
    </Card>
  );
}
