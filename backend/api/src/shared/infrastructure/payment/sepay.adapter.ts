import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../../../config/env';
import { ValidationError } from '../../domain/domain-error';
import { IncomingTransfer, PaymentPort } from '../../application/payment.port';

/**
 * Payload webhook SePay (các trường dùng tới).
 * Docs: https://docs.sepay.vn/tich-hop-webhooks.html
 */
const sepayPayload = z.object({
  id: z.union([z.number(), z.string()]),
  gateway: z.string().optional(),
  transactionDate: z.string(),
  accountNumber: z.string().nullish(),
  content: z.string().nullish(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number(),
  referenceCode: z.string().nullish(),
});

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

@Injectable()
export class SepayAdapter extends PaymentPort {
  /** SePay gửi header `Authorization: Apikey <KEY>`. */
  verifyWebhook(headers: Record<string, string | string[] | undefined>): boolean {
    const raw = headers['authorization'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return false;
    const match = /^Apikey\s+(.+)$/i.exec(value.trim());
    if (!match?.[1]) return false;
    return safeEqual(match[1], env.SEPAY_WEBHOOK_API_KEY);
  }

  parseWebhook(body: unknown): IncomingTransfer {
    const parsed = sepayPayload.safeParse(body);
    if (!parsed.success) throw new ValidationError('Payload webhook không hợp lệ');
    const p = parsed.data;
    // transactionDate dạng "2024-07-25 14:02:37" theo giờ VN (UTC+7)
    const transferredAt = new Date(p.transactionDate.replace(' ', 'T') + '+07:00');
    return {
      provider: 'sepay',
      providerTxId: String(p.id),
      amount: Math.round(p.transferAmount),
      content: p.content ?? '',
      bankAccount: p.accountNumber ?? null,
      transferredAt: isNaN(transferredAt.getTime()) ? new Date() : transferredAt,
      isIncoming: p.transferType === 'in',
      raw: body,
    };
  }

  buildQrUrl(input: { amount: number; content: string }): string {
    const params = new URLSearchParams({
      acc: env.BANK_ACCOUNT_NO,
      bank: env.BANK_CODE,
      amount: String(input.amount),
      des: input.content,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  bankInfo() {
    return {
      bankCode: env.BANK_CODE,
      accountNo: env.BANK_ACCOUNT_NO,
      accountName: env.BANK_ACCOUNT_NAME,
    };
  }
}
