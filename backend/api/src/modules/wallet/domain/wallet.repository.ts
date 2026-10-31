import type { LedgerEntry } from './ledger-entry';
import type { Wallet } from './wallet.entity';

export abstract class WalletRepository {
  /** Lấy ví (tự tạo nếu user chưa có ví). */
  abstract findByUserId(userId: string): Promise<Wallet>;
  /**
   * Cập nhật số dư + ghi sổ cái. Ném ConcurrencyError nếu version đã đổi
   * (request khác vừa thay đổi ví) → huỷ cả transaction.
   */
  abstract save(wallet: Wallet, entry: LedgerEntry): Promise<void>;
}
