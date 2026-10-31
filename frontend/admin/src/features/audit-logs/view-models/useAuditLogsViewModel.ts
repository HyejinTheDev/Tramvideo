import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@tram/shared';
import { auditQueries } from '../model/audit.api';

const ACTION_LABEL: Record<string, string> = {
  'video.create': 'Tạo video',
  'video.update': 'Sửa video',
  'video.upload': 'Upload file',
  'video.publish': 'Đăng video',
  'video.hide': 'Ẩn video',
  'category.create': 'Tạo danh mục',
  'category.update': 'Sửa danh mục',
  'category.delete': 'Xoá danh mục',
  'wallet.adjust': 'Điều chỉnh xu',
  'order.refund': 'Hoàn xu đơn',
  'payment.credit': 'Cộng xu khoản nạp',
  'payment.ignore': 'Bỏ qua khoản nạp',
  'user.lock': 'Khoá tài khoản',
  'user.unlock': 'Mở khoá tài khoản',
};

export function useAuditLogsViewModel() {
  const [params, setParams] = useSearchParams();
  const targetType = params.get('targetType') ?? undefined;
  const targetId = params.get('targetId') ?? undefined;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(auditQueries.list({ page, targetType, targetId }));
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return {
    isLoading,
    total,
    filterText: targetType ? `${targetType} ${targetId ?? ''}` : null,
    rows: (data?.items ?? []).map((l) => ({
      id: l.id,
      timeText: new Date(l.createdAt).toLocaleString('vi-VN'),
      actor: l.actorEmail ?? l.actorId,
      actionLabel: ACTION_LABEL[l.action] ?? l.action,
      target: `${l.targetType}:${l.targetId}`,
      dataText: l.data ? JSON.stringify(l.data) : '',
    })),
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    onPrev: () => setPage((p) => p - 1),
    onNext: () => setPage((p) => p + 1),
    onClearFilter: () => setParams({}),
  };
}
