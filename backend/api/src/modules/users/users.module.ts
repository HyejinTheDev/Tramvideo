import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListUsersQuery, SetUserLockUseCase } from './application/admin-users.use-cases';
import { AdminUsersController } from './presentation/admin-users.controller';

/** Hồ sơ người dùng (/me) nằm ở AuthModule; module này lo phần quản trị người dùng. */
@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController],
  providers: [ListUsersQuery, SetUserLockUseCase],
})
export class UsersModule {}
