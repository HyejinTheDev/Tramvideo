import { z } from 'zod';
import { paginationQuery } from './common';

export const paymentEventStatusSchema = z.enum(['MATCHED', 'UNMATCHED', 'RESOLVED', 'IGNORED']);
export type PaymentEventStatus = z.infer<typeof paymentEventStatusSchema>;

export const adminPaymentsQuery = paginationQuery.extend({
  status: paymentEventStatusSchema.optional(),
});
export type AdminPaymentsQuery = z.infer<typeof adminPaymentsQuery>;

export const paymentEventResponse = z.object({
  id: z.string(),
  provider: z.string(),
  providerTxId: z.string(),
  amount: z.number().int(),
  content: z.string(),
  status: paymentEventStatusSchema,
  transferredAt: z.string(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type PaymentEvent = z.infer<typeof paymentEventResponse>;

export const resolvePaymentSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('credit'),
    userId: z.string().min(1),
    amount: z.number().int().positive(),
    note: z.string().trim().min(1).max(500),
  }),
  z.object({ action: z.literal('ignore'), note: z.string().trim().min(1).max(500) }),
]);
export type ResolvePaymentInput = z.infer<typeof resolvePaymentSchema>;

export const adminUsersQuery = paginationQuery.extend({ q: z.string().trim().max(100).optional() });
export type AdminUsersQuery = z.infer<typeof adminUsersQuery>;

export const adminUserResponse = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  status: z.enum(['ACTIVE', 'LOCKED']),
  balance: z.number().int(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserResponse>;

export const walletAdjustmentSchema = z.object({
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0, 'Số xu điều chỉnh phải khác 0'),
  note: z.string().trim().min(3, 'Bắt buộc ghi lý do').max(500),
});
export type WalletAdjustmentInput = z.infer<typeof walletAdjustmentSchema>;

export const adminOrdersQuery = paginationQuery.extend({
  status: z.enum(['COMPLETED', 'REFUNDED']).optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuery>;

export const adminOrderResponse = z.object({
  id: z.string(),
  userEmail: z.string(),
  videoTitle: z.string(),
  price: z.number().int(),
  status: z.enum(['COMPLETED', 'REFUNDED']),
  createdAt: z.string(),
  refundedAt: z.string().nullable(),
});
export type AdminOrder = z.infer<typeof adminOrderResponse>;

export const refundOrderSchema = z.object({ note: z.string().trim().min(3).max(500) });
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;

export const statsQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type StatsQuery = z.infer<typeof statsQuery>;

export const statsResponse = z.object({
  revenue: z.number().int(),
  orderCount: z.number().int(),
  topUpAmount: z.number().int(),
  topUpCount: z.number().int(),
  newUsers: z.number().int(),
  unmatchedPayments: z.number().int(),
  topVideos: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      sold: z.number().int(),
      revenue: z.number().int(),
    }),
  ),
});
export type Stats = z.infer<typeof statsResponse>;

export const auditLogResponse = z.object({
  id: z.string(),
  actorId: z.string(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  data: z.unknown(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof auditLogResponse>;
