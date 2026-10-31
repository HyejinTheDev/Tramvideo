import { useMutation } from '@tanstack/react-query';
import { toMessage } from '@/lib/errorMessages';
import { downloadsApi } from '../model/download.api';

/** Nút tải: xin link có hạn → chuyển trình duyệt tới link (tải thẳng từ kho, không qua server). */
export function useDownloadViewModel(videoId: string) {
  const issue = useMutation({
    mutationFn: () => downloadsApi.issue(videoId),
    onSuccess: (link) => {
      window.location.href = link.url;
    },
  });

  return {
    isPreparing: issue.isPending,
    errorMessage: issue.error ? toMessage(issue.error) : null,
    onDownload: () => issue.mutate(),
  };
}
