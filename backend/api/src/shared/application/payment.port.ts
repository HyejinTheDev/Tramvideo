/** Giao dịch tiền vào đã chuẩn hoá từ webhook của nhà cung cấp. */
export interface IncomingTransfer {
  provider: string;
  providerTxId: string;
  amount: number;
  content: string;
  bankAccount: string | null;
  transferredAt: Date;
  /** true nếu là tiền vào (bỏ qua tiền ra). */
  isIncoming: boolean;
  raw: unknown;
}

/** Port xác thực & đọc webhook thanh toán; dựng link ảnh QR. */
export abstract class PaymentPort {
  abstract verifyWebhook(headers: Record<string, string | string[] | undefined>): boolean;
  abstract parseWebhook(body: unknown): IncomingTransfer;
  abstract buildQrUrl(input: { amount: number; content: string }): string;
  abstract bankInfo(): { bankCode: string; accountNo: string; accountName: string };
}
