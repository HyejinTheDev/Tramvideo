import { Module } from '@nestjs/common';
import { CategoriesService } from './application/categories.service';
import {
  AdminCategoriesController,
  CategoriesController,
} from './presentation/categories.controller';

@Module({
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
