import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDuration, formatVnd } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { useCurrentUser } from '../../auth/view-models/useCurrentUser';
import { orderQueries, ordersApi } from '../../orders/model/order.api';
import { videoQueries } from '../model/video.queries';
import { videosApi } from '../model/video.api';

export function useVideoDetailViewModel(slug: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, balance } = useCurrentUser();
  const [copied, setCopied] = useState(false);

  const { data: video, isLoading, isError } = useQuery(videoQueries.detail(slug));
  const { data: owned } = useQuery(orderQueries.owns(video?.id, isLoggedIn));

  const purchase = useMutation({
    mutationFn: ordersApi.purchase,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ]);
    },
  });

  const canAfford = !!video && balance !== null && balance >= video.price;

  return {
    video,
    isLoading,
    notFound: isError || (!isLoading && !video),
    isLoggedIn,
    isOwned: !!owned?.owned,
    priceText: video ? formatVnd(video.price) : '',
    durationText: video ? formatDuration(video.durationSec) : '',
    balanceText: balance !== null ? formatVnd(balance) : '',
    canAfford,
    isPurchasing: purchase.isPending,
    errorMessage: purchase.error ? toMessage(purchase.error) : null,
    copied,
    onPurchase: () => {
      if (!video) return;
      if (!isLoggedIn) return navigate(`/dang-nhap?tu=${encodeURIComponent(location.pathname)}`);
      if (!canAfford) return navigate(`/nap-tien?tu=${encodeURIComponent(location.pathname)}`);
      if (window.confirm(`Mua “${video.title}” với giá ${formatVnd(video.price)}?`)) {
        purchase.mutate({ videoId: video.id });
      }
    },
    onShare: async () => {
      if (!video) return;
      const url = videosApi.shareUrl(video.slug);
      if (navigator.share) {
        await navigator.share({ title: video.title, url }).catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
  };
}
