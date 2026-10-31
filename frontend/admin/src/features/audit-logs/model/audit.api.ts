import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AuditLog } from '@tram/shared';
import { api } from '@/lib/apiClient';

export type AuditQuery = {
  page: number;
  targetType?: string;
  targetId?: string;
};

export const auditApi = {
  list: (q: AuditQuery) => api.getPage<AuditLog>('/admin/audit-logs', q),
};

export const auditQueries = {
  list: (q: AuditQuery) =>
    queryOptions({ queryKey: ['audit', q], queryFn: () => auditApi.list(q), placeholderData: keepPreviousData }),
};
