import { Module } from '@nestjs/common';
import {
  AdjustWalletUseCase,
  CreateTopUpUseCase,
  GetMyTopUpQuery,
  GetMyWalletQuery,
  ListMyTransactionsQuery,
  TopUpPresenter,
} from './application/wallet.use-cases';
import { TopUpRepository } from './domain/top-up';
import { WalletRepository } from './domain/wallet.repository';
import { PrismaTopUpRepository } from './infrastructure/prisma-top-up.repository';
import { PrismaWalletRepository } from './infrastructure/prisma-wallet.repository';
import { AdminWalletController, WalletController } from './presentation/wallet.controller';

@Module({
  controllers: [WalletController, AdminWalletController],
  providers: [
    { provide: WalletRepository, useClass: PrismaWalletRepository },
    { provide: TopUpRepository, useClass: PrismaTopUpRepository },
    TopUpPresenter,
    GetMyWalletQuery,
    ListMyTransactionsQuery,
    CreateTopUpUseCase,
    GetMyTopUpQuery,
    AdjustWalletUseCase,
  ],
  exports: [WalletRepository, TopUpRepository],
})
export class WalletModule {}
