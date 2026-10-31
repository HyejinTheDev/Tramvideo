import { Body, PipeTransform, Query, SetMetadata } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';
import { ValidationError } from '../../domain/domain-error';
import { RAW_RESPONSE } from '../interceptors/response.interceptor';

/** Validate input bằng Zod schema dùng chung trong @tram/shared. */
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const first = result.error.issues[0];
      throw new ValidationError(
        first?.message ?? 'Dữ liệu không hợp lệ',
        result.error.flatten().fieldErrors,
      );
    }
    return result.data;
  }
}

/** @ZodBody(schema) thay cho @Body() + DTO class. */
export const ZodBody = (schema: ZodTypeAny) => Body(new ZodValidationPipe(schema));
export const ZodQuery = (schema: ZodTypeAny) => Query(new ZodValidationPipe(schema));

/** Trả response nguyên bản (không bọc { data }) — dùng cho HTML, webhook... */
export const RawResponse = () => SetMetadata(RAW_RESPONSE, true);
