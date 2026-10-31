import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { upsertCategorySchema, type UpsertCategoryInput } from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Public, Roles } from '../../../shared/presentation/decorators';
import { ZodBody } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { CategoriesService } from '../application/categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @Public()
  list() {
    return this.categories.list();
  }
}

@Controller('admin/categories')
@Roles('ADMIN')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @ZodBody(upsertCategorySchema) body: UpsertCategoryInput) {
    return this.categories.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ZodBody(upsertCategorySchema) body: UpsertCategoryInput,
  ) {
    return this.categories.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categories.remove(user.id, id);
  }
}
