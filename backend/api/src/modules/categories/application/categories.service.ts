import { Injectable } from '@nestjs/common';
import { Prisma } from '@tram/database';
import { slugify, type Category, type UpsertCategoryInput } from '@tram/shared';
import { DomainError, NotFoundError } from '../../../shared/domain/domain-error';
import { UnitOfWork } from '../../../shared/application/unit-of-work';
import { TransactionHost } from '../../../shared/infrastructure/prisma/transaction-host';
import { AuditLogger } from '../../audit/application/audit-logger';

/** Module làm gọn: CRUD đơn giản, gọi thẳng Prisma qua TransactionHost. */
@Injectable()
export class CategoriesService {
  constructor(
    private readonly txHost: TransactionHost,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditLogger,
  ) {}

  private toDto(c: { id: string; name: string; slug: string; sortOrder: number }): Category {
    return { id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder };
  }

  async list(): Promise<Category[]> {
    const rows = await this.txHost.tx.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((c) => this.toDto(c));
  }

  create(actorId: string, input: UpsertCategoryInput): Promise<Category> {
    return this.uow.run(async () => {
      const slug = input.slug || slugify(input.name);
      try {
        const c = await this.txHost.tx.category.create({
          data: { name: input.name, slug, sortOrder: input.sortOrder },
        });
        await this.audit.log({ actorId, action: 'category.create', targetType: 'category', targetId: c.id });
        return this.toDto(c);
      } catch (e) {
        throw this.mapUnique(e);
      }
    });
  }

  update(actorId: string, id: string, input: UpsertCategoryInput): Promise<Category> {
    return this.uow.run(async () => {
      await this.ensureExists(id);
      try {
        const c = await this.txHost.tx.category.update({
          where: { id },
          data: { name: input.name, slug: input.slug || slugify(input.name), sortOrder: input.sortOrder },
        });
        await this.audit.log({ actorId, action: 'category.update', targetType: 'category', targetId: id });
        return this.toDto(c);
      } catch (e) {
        throw this.mapUnique(e);
      }
    });
  }

  remove(actorId: string, id: string): Promise<void> {
    return this.uow.run(async () => {
      await this.ensureExists(id);
      const count = await this.txHost.tx.video.count({ where: { categoryId: id } });
      if (count > 0) {
        throw new DomainError('VALIDATION_ERROR', `Danh mục còn ${count} video, không thể xoá`);
      }
      await this.txHost.tx.category.delete({ where: { id } });
      await this.audit.log({ actorId, action: 'category.delete', targetType: 'category', targetId: id });
    });
  }

  private async ensureExists(id: string) {
    const c = await this.txHost.tx.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundError('Không tìm thấy danh mục');
  }

  private mapUnique(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new DomainError('SLUG_TAKEN', 'Slug đã được dùng');
    }
    return e;
  }
}
