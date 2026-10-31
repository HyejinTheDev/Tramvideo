import { Body, Controller, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  adminPaymentsQuery,
  resolvePaymentSchema,
  type AdminPaymentsQuery,
  type ResolvePaymentInput,
} from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Public, Roles } from '../../../shared/presentation/decorators';
import {
  RawResponse,
  ZodBody,
  ZodQuery,
} from '../../../shared/presentation/pipes/zod-validation.pipe';
import {
  HandlePaymentWebhookUseCase,
  ListPaymentEventsQuery,
  ResolvePaymentUseCase,
} from '../application/payments.use-cases';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly handleWebhook: HandlePaymentWebhookUseCase) {}

  /** SePay gọi khi có tiền vào. Luôn trả 200 khi đã lưu event để SePay không gửi lại mãi. */
  @Post('sepay')
  @Public()
  @SkipThrottle()
  @RawResponse()
  @HttpCode(200)
  async sepay(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const outcome = await this.handleWebhook.execute(headers, body);
    return { success: true, outcome };
  }
}

@Controller('admin/payments')
@Roles('ADMIN')
export class AdminPaymentsController {
  constructor(
    private readonly list: ListPaymentEventsQuery,
    private readonly resolve: ResolvePaymentUseCase,
  ) {}

  @Get()
  index(@ZodQuery(adminPaymentsQuery) q: AdminPaymentsQuery) {
    return this.list.execute(q);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  async doResolve(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @ZodBody(resolvePaymentSchema) body: ResolvePaymentInput,
  ) {
    await this.resolve.execute(admin.id, id, body);
    return { ok: true };
  }
}
