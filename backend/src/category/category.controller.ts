import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { Category } from './category.entity';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoryService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: Partial<Category>): Promise<Category> {
    return this.categoryService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Category>,
  ): Promise<Category | null> {
    return this.categoryService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(Number(id));
  }
}