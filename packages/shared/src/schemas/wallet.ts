import { z } from 'zod';
import { TOPUP_MAX_AMOUNT, TOPUP_MIN_AMOUNT } from '../constants';

export const ledgerTypeSchema = z.enum(['TOPUP', 'PURCHASE', 'REFUND', 'ADJUSTMENT']);
export type LedgerType = z.infer<typeof ledgerTypeSchema>;

export const walletResponse = z.object({ balance: z.number().int() });
export type Wallet = z.infer<typeof walletResponse>;

export const walletTransactionResponse = z.object({
  id: z.string(),
  type: ledgerTypeSchema,
  amount: z.number().int(),
  balanceAfter: z.number().int(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type WalletTransaction = z.infer<typeof walletTransactionResponse>;

export const createTopUpSchema = z.object({
  amount: z
    .number()
    .int()
    .min(TOPUP_MIN_AMOUNT, `Nạp tối thiểu ${TOPUP_MIN_AMOUNT.toLocaleString('vi-VN')}đ`)
    .max(TOPUP_MAX_AMOUNT),
});
export type CreateTopUpInput = z.infer<typeof createTopUpSchema>;

export const topUpStatusSchema = z.enum(['PENDING', 'COMPLETED', 'EXPIRED']);
export type TopUpStatus = z.infer<typeof topUpStatusSchema>;

export const topUpResponse = z.object({
  id: z.string(),
  code: z.string(),
  amount: z.number().int(),
  status: topUpStatusSchema,
  qrUrl: z.string(),
  bankCode: z.string(),
  bankAccountNo: z.string(),
  bankAccountName: z.string(),
  expiresAt: z.string(),
  completedAt: z.string().nullable(),
});
export type TopUp = z.infer<typeof topUpResponse>;
