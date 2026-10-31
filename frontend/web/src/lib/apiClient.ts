import type { ApiErrorBody, ErrorCode, PageMeta, Paginated } from '@tram/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Gọi /auth/refresh 1 lần dù nhiều request cùng hết hạn token. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<{ data: T; meta?: PageMeta }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include', // gửi cookie httpOnly
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  // Access token hết hạn → thử refresh rồi gọi lại đúng 1 lần.
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return request<T>(path, init, false);
  }

  const body = (await res.json().catch(() => null)) as
    | { data: T; meta?: PageMeta }
    | ApiErrorBody
    | null;

  if (!res.ok || !body || 'error' in body) {
    const err = body && 'error' in body ? body.error : undefined;
    throw new ApiError(res.status, err?.code ?? 'INTERNAL_ERROR', err?.message ?? 'Lỗi kết nối', err?.details);
  }
  return body;
}

function toQuery(params?: Record<string, unknown>) {
  if (!params) return '';
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return (await request<T>(path + toQuery(params))).data;
  },
  async getPage<T>(path: string, params?: Record<string, unknown>): Promise<Paginated<T>> {
    const res = await request<T[]>(path + toQuery(params));
    return { items: res.data, meta: res.meta ?? { page: 1, pageSize: res.data.length, total: res.data.length } };
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })).data;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    return (await request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })).data;
  },
  async delete<T>(path: string): Promise<T> {
    return (await request<T>(path, { method: 'DELETE' })).data;
  },
};
