/**
 * Port transaction. Use case gọi `uow.run(async () => ...)`;
 * mọi repository chạy bên trong dùng chung 1 transaction DB.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
