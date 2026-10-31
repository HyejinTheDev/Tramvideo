import { Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createTopUpSchema,
  paginationQuery,
  walletAdjustmentSchema,
  type CreateTopUpInput,
  type PaginationQuery,
  type WalletAdjustmentInput,
} from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Roles } from '../../../shared/presentation/decorators';
import { ZodBody, ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import {
  AdjustWalletUseCase,
  CreateTopUpUseCase,
  GetMyTopUpQuery,
  GetMyWalletQuery,
  ListMyTransactionsQuery,
} from '../application/wallet.use-cases';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly getWallet: GetMyWalletQuery,
    private readonly listTransactions: ListMyTransactionsQuery,
    private readonly createTopUp: CreateTopUpUseCase,
    private readonly getTopUp: GetMyTopUpQuery,
  ) {}

  @Get()
  wallet(@CurrentUser() user: AuthUser) {
    return this.getWallet.execute(user.id);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: AuthUser, @ZodQuery(paginationQuery) q: PaginationQuery) {
    return this.listTransactions.execute(user.id, q);
  }

  @Post('top-ups')
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  topUp(@CurrentUser() user: AuthUser, @ZodBody(createTopUpSchema) body: CreateTopUpInput) {
    return this.createTopUp.execute(user.id, body);
  }

  @Get('top-ups/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  topUpStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getTopUp.execute(user.id, id);
  }
}

@Controller('admin/users/:userId/wallet-adjustments')
@Roles('ADMIN')
export class AdminWalletController {
  constructor(private readonly adjust: AdjustWalletUseCase) {}

  @Post()
  create(
    @CurrentUser() admin: AuthUser,
    @Param('userId') userId: string,
    @ZodBody(walletAdjustmentSchema) body: WalletAdjustmentInput,
  ) {
    return this.adjust.execute(admin.id, userId, body);
  }
}
