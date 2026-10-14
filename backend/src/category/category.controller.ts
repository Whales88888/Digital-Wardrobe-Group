import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { Category } from './category.entity';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import type { CategoryPageQuery } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get('page')
  findPage(@Query() query: CategoryPageQuery) {
    return this.categoryService.findPage(query);
  }

  @Get('usage')
  getUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.categoryService.getUsage(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoryService.findOne(Number(id));
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Category>): Promise<Category> {
    return this.categoryService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Category>,
  ): Promise<Category | null> {
    return this.categoryService.update(Number(id), data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(Number(id));
  }
}