import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { ApiResponse, Paginated } from '@tram/shared';

export const RAW_RESPONSE = 'rawResponse';

function isPaginated(v: unknown): v is Paginated<unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as Paginated<unknown>).items) &&
    typeof (v as Paginated<unknown>).meta === 'object'
  );
}

/** Bọc response chuẩn { data, meta? }. Kết quả phân trang { items, meta } → { data: items, meta }. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = ctx.getHandler();
    if (Reflect.getMetadata(RAW_RESPONSE, handler)) return next.handle();
    return next.handle().pipe(
      map((value): ApiResponse<unknown> => {
        if (isPaginated(value)) return { data: value.items, meta: value.meta };
        return { data: value ?? null };
      }),
    );
  }
}
