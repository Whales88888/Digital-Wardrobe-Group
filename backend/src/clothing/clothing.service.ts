import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Like, type FindOptionsWhere } from 'typeorm';
import {
  CLOTHING_SEASONS,
  CLOTHING_TYPES,
  Clothing,
  type ClothingSeason,
  type ClothingType,
} from './clothing.entity';

export interface ClothingFilters {
  page?: string;
  page_size?: string;
  category_id?: string;
  season?: string;
  clothing_type?: string;
  search?: string;
  sort?: string;
}

export interface PaginatedClothing {
  items: Clothing[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new BadRequestException(`${name} is outside the supported range`);
  }
  return parsed;
}

@Injectable()
export class ClothingService {
  constructor(
    @Inject('CLOTHING_REPOSITORY')
    private readonly clothingRepository: Repository<Clothing>,
  ) {}

  async findAll(user_id: number, filters: ClothingFilters = {}): Promise<PaginatedClothing> {
    const page = parsePositiveInteger(filters.page, 1, 'page');
    const page_size = parsePositiveInteger(filters.page_size, 24, 'page_size');
    if (page_size > 100) {
      throw new BadRequestException('page_size cannot exceed 100');
    }
    if (page > Math.floor(Number.MAX_SAFE_INTEGER / page_size)) {
      throw new BadRequestException('page is outside the supported range');
    }
    const where: FindOptionsWhere<Clothing> = { user_id };

    if (filters.category_id !== undefined) {
      where.category_id = parsePositiveInteger(filters.category_id, 0, 'category_id');
    }
    if (filters.season !== undefined) {
      if (!CLOTHING_SEASONS.includes(filters.season as ClothingSeason)) {
        throw new BadRequestException('Unsupported clothing season');
      }
      where.season = filters.season as ClothingSeason;
    }
    if (filters.clothing_type !== undefined) {
      if (!CLOTHING_TYPES.includes(filters.clothing_type as ClothingType)) {
        throw new BadRequestException('Unsupported clothing type');
      }
      where.clothing_type = filters.clothing_type as ClothingType;
    }
    const search = filters.search?.trim();
    if (search !== undefined && search.length > 100) {
      throw new BadRequestException('search cannot exceed 100 characters');
    }
    const sort = filters.sort ?? 'name';
    if (!['name', 'color'].includes(sort)) {
      throw new BadRequestException('sort must be name or color');
    }
    const conditions: FindOptionsWhere<Clothing>[] = search
      ? [
          { ...where, name: Like(`%${search}%`) },
          { ...where, color: Like(`%${search}%`) },
          { ...where, size: Like(`%${search}%`) },
        ]
      : [where];

    const [items, total] = await this.clothingRepository.findAndCount({
      where: conditions,
      order: sort === 'color'
        ? { color: 'ASC', name: 'ASC', clothing_id: 'ASC' }
        : { name: 'ASC', clothing_id: 'ASC' },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    return {
      items,
      page,
      page_size,
      total,
      total_pages: Math.ceil(total / page_size),
    };
  }

  async findOne(
    clothing_id: number,
    user_id: number,
  ): Promise<Clothing | null> {
    return this.clothingRepository.findOne({
      where: { clothing_id, user_id },
    });
  }

  async create(data: unknown, user_id: number): Promise<Clothing> {
    const fields = this.parseFields(data);
    if (
      typeof fields.name !== 'string' ||
      !fields.name.trim() ||
      fields.name.trim().length > 100
    ) {
      throw new BadRequestException(
        'Clothing name must contain between 1 and 100 characters',
      );
    }
    if (!Number.isSafeInteger(fields.category_id) || fields.category_id! < 1) {
      throw new BadRequestException('A valid category_id is required');
    }
    fields.name = fields.name.trim();
    this.validateFilters(fields);
    const clothing = this.clothingRepository.create({ ...fields, user_id });
    return this.clothingRepository.save(clothing);
  }

  async update(
    clothing_id: number,
    data: unknown,
    user_id: number,
  ): Promise<Clothing | null> {
    const existing = await this.findOne(clothing_id, user_id);
    if (!existing) {
      throw new NotFoundException('Clothing not found');
    }

    const fields = this.parseFields(data);
    this.validateFilters(fields);
    if (fields.name !== undefined) {
      if (
        typeof fields.name !== 'string' ||
        !fields.name.trim() ||
        fields.name.trim().length > 100
      ) {
        throw new BadRequestException(
          'Clothing name must contain between 1 and 100 characters',
        );
      }
      fields.name = fields.name.trim();
    }
    if (
      fields.category_id !== undefined &&
      (!Number.isSafeInteger(fields.category_id) || fields.category_id < 1)
    ) {
      throw new BadRequestException('category_id must be a positive integer');
    }
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('At least one clothing field is required');
    }
    await this.clothingRepository.update({ clothing_id, user_id }, fields);
    return this.findOne(clothing_id, user_id);
  }

  async remove(clothing_id: number, user_id: number): Promise<void> {
    const result = await this.clothingRepository.delete({
      clothing_id,
      user_id,
    });
    if (!result.affected) {
      throw new NotFoundException('Clothing not found');
    }
  }

  private validateFilters(data: Partial<Clothing>): void {
    this.validateOptionalString(data.color, 'color', 50);
    this.validateOptionalString(data.size, 'size', 20);
    this.validateOptionalString(data.image_url, 'image_url', 500);
    this.validateOptionalString(data.care_instructions, 'care_instructions', 2000);
    if (data.season != null && !CLOTHING_SEASONS.includes(data.season)) {
      throw new BadRequestException('Unsupported clothing season');
    }
    if (
      data.clothing_type != null &&
      !CLOTHING_TYPES.includes(data.clothing_type)
    ) {
      throw new BadRequestException('Unsupported clothing type');
    }
    if (
      data.wash_after_wears !== undefined &&
      (!Number.isSafeInteger(data.wash_after_wears) ||
        data.wash_after_wears < 1 ||
        data.wash_after_wears > 30)
    ) {
      throw new BadRequestException(
        'Wash reminder interval must be between 1 and 30 wears',
      );
    }
    if (data.last_washed_at != null && !this.isValidDate(data.last_washed_at)) {
      throw new BadRequestException(
        'Last washed date must be a valid date in YYYY-MM-DD format',
      );
    }
  }

  private parseFields(data: unknown): Partial<Clothing> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new BadRequestException('Clothing data must be an object');
    }
    const {
      clothing_id: _id,
      user_id: _owner,
      ...fields
    } = data as Record<string, unknown>;
    const allowedFields = new Set([
      'category_id',
      'name',
      'color',
      'size',
      'image_url',
      'season',
      'clothing_type',
      'care_instructions',
      'last_washed_at',
      'wash_after_wears',
    ]);
    const unsupportedField = Object.keys(fields).find(
      (field) => !allowedFields.has(field),
    );
    if (unsupportedField) {
      throw new BadRequestException(`Unsupported clothing field: ${unsupportedField}`);
    }
    return fields as Partial<Clothing>;
  }

  private validateOptionalString(
    value: unknown,
    field: string,
    maxLength: number,
  ): void {
    if (value !== undefined && value !== null &&
        (typeof value !== 'string' || value.length > maxLength)) {
      throw new BadRequestException(
        `${field} must be a string of at most ${maxLength} characters`,
      );
    }
  }

  private isValidDate(value: unknown): boolean {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }
}
