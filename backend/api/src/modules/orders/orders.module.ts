import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { WalletModule } from '../wallet/wallet.module';
import { ListAllOrdersQuery, RefundOrderUseCase } from './application/admin-orders.use-cases';
import { CheckOwnershipQuery, ListMyOrdersUseCase } from './application/list-my-orders.use-case';
import { PurchaseVideoUseCase } from './application/purchase-video.use-case';
import { OrderRepository } from './domain/order.repository';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { AdminOrdersController, OrdersController } from './presentation/orders.controller';

@Module({
  imports: [WalletModule, VideosModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [
    { provide: OrderRepository, useClass: PrismaOrderRepository },
    PurchaseVideoUseCase,
    ListMyOrdersUseCase,
    CheckOwnershipQuery,
    ListAllOrdersQuery,
    RefundOrderUseCase,
  ],
  exports: [OrderRepository],
})
export class OrdersModule {}
