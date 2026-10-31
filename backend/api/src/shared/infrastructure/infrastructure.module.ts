import { Global, Module } from '@nestjs/common';
import { ClockPort, SystemClock } from '../application/clock.port';
import { MailerPort } from '../application/mailer.port';
import { PaymentPort } from '../application/payment.port';
import { StoragePort } from '../application/storage.port';
import { UnitOfWork } from '../application/unit-of-work';
import { ResendMailerAdapter } from './mail/resend-mailer.adapter';
import { SepayAdapter } from './payment/sepay.adapter';
import { PrismaService } from './prisma/prisma.service';
import { PrismaUnitOfWork, TransactionHost } from './prisma/transaction-host';
import { R2StorageAdapter } from './storage/r2-storage.adapter';

/** Nối các port (interface) với cài đặt cụ thể. Dùng chung toàn app. */
@Global()
@Module({
  providers: [
    PrismaService,
    TransactionHost,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
    { provide: StoragePort, useClass: R2StorageAdapter },
    { provide: PaymentPort, useClass: SepayAdapter },
    { provide: MailerPort, useClass: ResendMailerAdapter },
    { provide: ClockPort, useClass: SystemClock },
  ],
  exports: [PrismaService, TransactionHost, UnitOfWork, StoragePort, PaymentPort, MailerPort, ClockPort],
})
export class InfrastructureModule {}
