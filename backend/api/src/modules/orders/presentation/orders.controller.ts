import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  adminOrdersQuery,
  paginationQuery,
  purchaseVideoSchema,
  refundOrderSchema,
  type AdminOrdersQuery,
  type PaginationQuery,
  type PurchaseVideoInput,
  type RefundOrderInput,
} from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Roles } from '../../../shared/presentation/decorators';
import { ZodBody, ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { ListAllOrdersQuery, RefundOrderUseCase } from '../application/admin-orders.use-cases';
import { CheckOwnershipQuery, ListMyOrdersUseCase } from '../application/list-my-orders.use-case';
import { PurchaseVideoUseCase } from '../application/purchase-video.use-case';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly purchaseVideo: PurchaseVideoUseCase,
    private readonly listMyOrders: ListMyOrdersUseCase,
    private readonly checkOwnership: CheckOwnershipQuery,
  ) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  purchase(@CurrentUser() user: AuthUser, @ZodBody(purchaseVideoSchema) body: PurchaseVideoInput) {
    return this.purchaseVideo.execute({ userId: user.id, videoId: body.videoId });
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @ZodQuery(paginationQuery) q: PaginationQuery) {
    return this.listMyOrders.execute(user.id, q);
  }

  @Get('owns/:videoId')
  owns(@CurrentUser() user: AuthUser, @Param('videoId') videoId: string) {
    return this.checkOwnership.execute(user.id, videoId);
  }
}

@Controller('admin/orders')
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(
    private readonly listAll: ListAllOrdersQuery,
    private readonly refundOrder: RefundOrderUseCase,
  ) {}

  @Get()
  list(@ZodQuery(adminOrdersQuery) q: AdminOrdersQuery) {
    return this.listAll.execute(q);
  }

  @Post(':id/refund')
  @HttpCode(200)
  async refund(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @ZodBody(refundOrderSchema) body: RefundOrderInput,
  ) {
    await this.refundOrder.execute(admin.id, id, body);
    return { ok: true };
  }
}
