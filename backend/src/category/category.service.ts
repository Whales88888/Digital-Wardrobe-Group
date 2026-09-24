import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Hiển thị tất cả category
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  // Hiển thị một category theo ID
  async findOne(category_id: number): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { category_id },
    });
  }

  // Thêm category
  async create(data: Partial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  // Cập nhật category
  async update(
    category_id: number,
    data: Partial<Category>,
  ): Promise<Category | null> {
    await this.categoryRepository.update(category_id, data);

    return this.categoryRepository.findOne({
      where: { category_id },
    });
  }

  // Xóa category
  async remove(category_id: number): Promise<void> {
    await this.categoryRepository.delete(category_id);
  }
}