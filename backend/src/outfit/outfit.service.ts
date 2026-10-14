import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Outfit } from './outfit.entity';

export interface OutfitPageQuery {
  page?: string;
  page_size?: string;
}

@Injectable()
export class OutfitService {
  constructor(
    @Inject('OUTFIT_REPOSITORY')
    private readonly outfitRepository: Repository<Outfit>,
  ) {}

  findAll(user_id: number) {
    return this.outfitRepository.find({ where: { user_id } });
  }

  async findPage(user_id: number, query: OutfitPageQuery) {
    const page = this.parsePage(query.page, 1, 'page');
    const page_size = this.parsePage(query.page_size, 12, 'page_size');
    if (page_size > 100 || page > Math.floor(Number.MAX_SAFE_INTEGER / page_size)) {
      throw new BadRequestException('Pagination is outside the supported range');
    }
    const [items, total] = await this.outfitRepository.findAndCount({
      where: { user_id },
      order: { name: 'ASC', outfit_id: 'ASC' },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    return { items, page, page_size, total, total_pages: Math.ceil(total / page_size) };
  }

  findOne(outfit_id: number, user_id: number) {
    return this.outfitRepository.findOne({ where: { outfit_id, user_id } });
  }

  async create(data: unknown, user_id: number): Promise<Outfit> {
    const fields = this.parseFields(data);
    if (typeof fields.name !== 'string' || !fields.name.trim()) {
      throw new BadRequestException('An outfit name is required');
    }
    fields.name = fields.name.trim();
    return this.outfitRepository.save(
      this.outfitRepository.create({ ...fields, user_id }),
    );
  }

  async update(outfit_id: number,   data: unknown, user_id: number) {
    const existing = await this.findOne(outfit_id, user_id);
    if (!existing) {
      throw new NotFoundException('Outfit not found');
    }

    const fields = this.parseFields(data);
    if (fields.name !== undefined) {
      if (typeof fields.name !== 'string' || !fields.name.trim()) {
        throw new BadRequestException('Outfit name cannot be empty');
      }
      fields.name = fields.name.trim();
    }
    if (
      fields.description !== undefined &&
      fields.description !== null &&
      typeof fields.description !== 'string'
    ) {
      throw new BadRequestException('Outfit description must be a string');
    }
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('At least one outfit field is required');
    }
    await this.outfitRepository.update({ outfit_id, user_id }, fields);
    return this.findOne(outfit_id, user_id);
  }

  async remove(outfit_id: number, user_id: number) {
    const result = await this.outfitRepository.delete({ outfit_id, user_id });
    if (!result.affected) {
      throw new NotFoundException('Outfit not found');
    }
  }

  private parseFields(data: unknown): Partial<Outfit> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new BadRequestException('Outfit data must be an object');
    }
    const { outfit_id: _id, user_id: _owner, ...fields } =
      data as Record<string, unknown>;
    const allowedFields = new Set(['name', 'description']);
    const unsupportedField = Object.keys(fields).find(
      (field) => !allowedFields.has(field),
    );
    if (unsupportedField) {
      throw new BadRequestException(`Unsupported outfit field: ${unsupportedField}`);
    }
    if (
      fields.name !== undefined &&
      (typeof fields.name !== 'string' ||
        fields.name.trim().length === 0 ||
        fields.name.trim().length > 100)
    ) {
      throw new BadRequestException(
        'Outfit name must contain between 1 and 100 characters',
      );
    }
    if (
      fields.description !== undefined &&
      fields.description !== null &&
      (typeof fields.description !== 'string' ||
        fields.description.length > 5000)
    ) {
      throw new BadRequestException(
        'Outfit description cannot exceed 5000 characters',
      );
    }
    return fields as Partial<Outfit>;
  }

  private parsePage(value: string | undefined, fallback: number, field: string): number {
    if (value === undefined) return fallback;
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new BadRequestException(`${field} is outside the supported range`);
    }
    return parsed;
  }
}
