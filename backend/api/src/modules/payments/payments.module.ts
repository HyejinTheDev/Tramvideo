import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import {
  HandlePaymentWebhookUseCase,
  ListPaymentEventsQuery,
  ResolvePaymentUseCase,
} from './application/payments.use-cases';
import { PaymentEventRepository } from './domain/payment-event';
import { PrismaPaymentEventRepository } from './infrastructure/prisma-payment-event.repository';
import { AdminPaymentsController, WebhooksController } from './presentation/payments.controller';

@Module({
  imports: [WalletModule],
  controllers: [WebhooksController, AdminPaymentsController],
  providers: [
    { provide: PaymentEventRepository, useClass: PrismaPaymentEventRepository },
    HandlePaymentWebhookUseCase,
    ListPaymentEventsQuery,
    ResolvePaymentUseCase,
  ],
})
export class PaymentsModule {}
