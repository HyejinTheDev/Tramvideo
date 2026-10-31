import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { adminUsersQuery, type AdminUsersQuery } from '@tram/shared';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { CurrentUser, Roles } from '../../../shared/presentation/decorators';
import { ZodQuery } from '../../../shared/presentation/pipes/zod-validation.pipe';
import { ListUsersQuery, SetUserLockUseCase } from '../application/admin-users.use-cases';

@Controller('admin/users')
@Roles('ADMIN')
export class AdminUsersController {
  constructor(
    private readonly listUsers: ListUsersQuery,
    private readonly setLock: SetUserLockUseCase,
  ) {}

  @Get()
  list(@ZodQuery(adminUsersQuery) q: AdminUsersQuery) {
    return this.listUsers.execute(q);
  }

  @Post(':id/lock')
  @HttpCode(200)
  async lock(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    await this.setLock.execute(admin.id, id, true);
    return { ok: true };
  }

  @Post(':id/unlock')
  @HttpCode(200)
  async unlock(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    await this.setLock.execute(admin.id, id, false);
    return { ok: true };
  }
}
