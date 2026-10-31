import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatVnd } from '@tram/shared';
import { statsQueries } from '../model/stats.api';

type Range = 'today' | '7d' | '30d';

function rangeDates(r: Range): { from?: string; to?: string } {
  if (r === 'today') return {}; // API mặc định: hôm nay (giờ VN)
  const days = r === '7d' ? 7 : 30;
  return { from: new Date(Date.now() - days * 86400_000).toISOString(), to: new Date().toISOString() };
}

export function useDashboardViewModel() {
  const [range, setRange] = useState<Range>('today');
  const { from, to } = rangeDates(range);
  const { data, isLoading } = useQuery(statsQueries.get(from, to));

  return {
    isLoading,
    range,
    ranges: [
      { value: 'today' as const, label: 'Hôm nay' },
      { value: '7d' as const, label: '7 ngày' },
      { value: '30d' as const, label: '30 ngày' },
    ],
    cards: data
      ? [
          { label: 'Doanh thu (xu đã tiêu)', value: formatVnd(data.revenue) },
          { label: 'Số đơn', value: String(data.orderCount) },
          { label: 'Tiền nạp', value: formatVnd(data.topUpAmount).replace(' xu', 'đ') },
          { label: 'Lượt nạp', value: String(data.topUpCount) },
          { label: 'Người dùng mới', value: String(data.newUsers) },
        ]
      : [],
    unmatchedPayments: data?.unmatchedPayments ?? 0,
    topVideos: (data?.topVideos ?? []).map((v) => ({ ...v, revenueText: formatVnd(v.revenue) })),
    onRangeChange: setRange,
  };
}
