import { Injectable } from '@nestjs/common';
import { Prisma } from '@tram/database';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { VideoNotFoundError } from '../../videos/domain/video.errors';
import { VideoRepository } from '../../videos/domain/video.repository';
import { LedgerEntry } from '../../wallet/domain/ledger-entry';
import { WalletRepository } from '../../wallet/domain/wallet.repository';
import { Order } from '../domain/order.entity';
import { AlreadyPurchasedError } from '../domain/order.errors';
import { OrderRepository } from '../domain/order.repository';

/**
 * Mua video bằng xu (1 transaction):
 * video PUBLISHED? → chưa mua? → ví đủ xu? → trừ xu (khoá version) → tạo Order → ghi sổ cái → tăng purchaseCount
 */
@Injectable()
export class PurchaseVideoUseCase {
  constructor(
    private readonly videos: VideoRepository,
    private readonly wallets: WalletRepository,
    private readonly orders: OrderRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: { userId: string; videoId: string }): Promise<{ orderId: string; balance: number }> {
    try {
      return await this.uow.run(async () => {
        const video = await this.videos.findPublishedById(input.videoId);
        if (!video) throw new VideoNotFoundError();

        let order = await this.orders.findByUserAndVideo(input.userId, video.id);
        if (order) {
          order.repurchase(video.price); // ném AlreadyPurchasedError nếu đang sở hữu
        } else {
          order = Order.create({ userId: input.userId, videoId: video.id, price: video.price });
        }

        const wallet = await this.wallets.findByUserId(input.userId);
        wallet.debit(video.price);

        await this.orders.save(order);
        await this.wallets.save(wallet, LedgerEntry.purchase(video.price, order.id));
        await this.videos.incrementPurchaseCount(video.id);

        return { orderId: order.id, balance: wallet.balance.amount };
      });
    } catch (e) {
      // 2 request mua cùng video cùng lúc → unique (userId, videoId) chặn request sau.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AlreadyPurchasedError();
      }
      throw e;
    }
  }
}
