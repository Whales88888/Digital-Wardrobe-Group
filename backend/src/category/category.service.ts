import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from './category.entity';

export interface CategoryUsage {
  category_id: number;
  count: number;
}

@Injectable()
export class CategoryService {
  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private readonly categoryRepository: Repository<Category>,
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
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

  async getUsage(user_id: number): Promise<CategoryUsage[]> {
    return this.dataSource.query(
      `SELECT category_id, COUNT(*) AS count
       FROM clothing
       WHERE user_id = ?
       GROUP BY category_id`,
      [user_id],
    );
  }

  // Thêm category
  async create(data: Partial<Category>): Promise<Category> {
    const name = this.validateName(data?.name);
    const category = this.categoryRepository.create({ name });
    return this.categoryRepository.save(category);
  }

  // Cập nhật category
  async update(
    category_id: number,
    data: Partial<Category>,
  ): Promise<Category | null> {
    if (!(await this.findOne(category_id))) {
      throw new NotFoundException('Category not found');
    }
    const name = this.validateName(data?.name);
    await this.categoryRepository.update(category_id, { name });

    return this.categoryRepository.findOne({
      where: { category_id },
    });
  }

  // Xóa category
  async remove(category_id: number): Promise<void> {
    if (!(await this.findOne(category_id))) {
      throw new NotFoundException('Category not found');
    }
    const rows = await this.dataSource.query(
      'SELECT COUNT(*) AS count FROM clothing WHERE category_id = ?',
      [category_id],
    ) as { count: number | string }[];
    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new ConflictException('Reassign or remove clothing before deleting this category');
    }
    await this.categoryRepository.delete(category_id);
  }

  private validateName(value: unknown): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
      throw new BadRequestException('Category name must contain between 1 and 100 characters');
    }
    return value.trim();
  }
}