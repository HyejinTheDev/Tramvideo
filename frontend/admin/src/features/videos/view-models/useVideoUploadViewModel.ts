import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminVideo, UploadKind } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { videosApi } from '../model/video.api';

/** PUT file thẳng lên kho (R2) bằng presigned URL, có tiến độ %. */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload lỗi (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload lỗi mạng (kiểm tra CORS của bucket R2)'));
    xhr.send(file);
  });
}

const KINDS: { kind: UploadKind; label: string; accept: string; hint: string }[] = [
  { kind: 'original', label: 'File gốc', accept: 'video/*', hint: 'Lưu bucket riêng tư, chỉ người mua tải được' },
  { kind: 'preview', label: 'Preview (có watermark)', accept: 'video/*', hint: 'Công khai – cắt 15–20 giây, có watermark' },
  { kind: 'thumbnail', label: 'Ảnh bìa', accept: 'image/jpeg,image/png,image/webp', hint: 'Công khai – tỉ lệ 9:16' },
];

export function useVideoUploadViewModel(video: AdminVideo | undefined) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<Partial<Record<UploadKind, number>>>({});
  const [errors, setErrors] = useState<Partial<Record<UploadKind, string>>>({});

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['videos'] });

  const upload = useMutation({
    mutationFn: async ({ kind, file }: { kind: UploadKind; file: File }) => {
      if (!video) return;
      setErrors((e) => ({ ...e, [kind]: undefined }));
      const { url, key } = await videosApi.uploadUrl(video.id, {
        kind,
        contentType: file.type || 'application/octet-stream',
        fileName: file.name,
      });
      await putWithProgress(url, file, (pct) => setProgress((p) => ({ ...p, [kind]: pct })));
      await videosApi.uploadComplete(video.id, { kind, key });
    },
    onSuccess: () => void refresh(),
    onError: (err, { kind }) => {
      setErrors((e) => ({ ...e, [kind]: err instanceof Error && !('code' in err) ? err.message : toMessage(err) }));
      setProgress((p) => ({ ...p, [kind]: undefined }));
    },
  });

  const publish = useMutation({ mutationFn: () => videosApi.publish(video!.id), onSuccess: () => void refresh() });
  const hide = useMutation({ mutationFn: () => videosApi.hide(video!.id), onSuccess: () => void refresh() });

  const has: Record<UploadKind, boolean> = {
    original: !!video?.hasOriginal,
    preview: !!video?.hasPreview,
    thumbnail: !!video?.hasThumbnail,
  };

  return {
    slots: KINDS.map((k) => ({
      ...k,
      done: has[k.kind],
      progress: progress[k.kind],
      error: errors[k.kind],
      busy: upload.isPending && upload.variables?.kind === k.kind,
    })),
    isUploading: upload.isPending,
    status: video?.status,
    previewUrl: video?.previewUrl ?? null,
    thumbnailUrl: video?.thumbnailUrl ?? null,
    canPublish: has.original && has.preview && has.thumbnail && video?.status !== 'PUBLISHED',
    canHide: video?.status === 'PUBLISHED',
    actionError: publish.error ? toMessage(publish.error) : hide.error ? toMessage(hide.error) : null,
    onFile: (kind: UploadKind, file: File | undefined) => file && upload.mutate({ kind, file }),
    onPublish: () => publish.mutate(),
    onHide: () => window.confirm('Ẩn video khỏi trang bán? Người đã mua vẫn tải được.') && hide.mutate(),
  };
}
