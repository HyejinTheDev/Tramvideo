import type { NextFunction, Request, Response } from 'express';

/**
 * Chống CSRF lớp 2 (lớp 1 là cookie SameSite=Lax):
 * request ghi dữ liệu có header Origin thì Origin phải nằm trong danh sách cho phép.
 * Webhook (server → server, không có Origin) không bị ảnh hưởng.
 */
export function originGuard(allowed: string[]) {
  const set = new Set(allowed.map((o) => o.replace(/\/$/, '')));
  return (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin && !set.has(origin)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Origin không hợp lệ' } });
      return;
    }
    next();
  };
}
