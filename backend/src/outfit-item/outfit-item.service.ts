import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Clothing } from '../clothing/clothing.entity';
import { Outfit } from '../outfit/outfit.entity';
import { OutfitItem } from './outfit-item.entity';

@Injectable()
export class OutfitItemService {
  private readonly outfitItemRepository: Repository<OutfitItem>;
  private readonly outfitRepository: Repository<Outfit>;
  private readonly clothingRepository: Repository<Clothing>;

  constructor(@Inject('DATA_SOURCE') dataSource: DataSource) {
    this.outfitItemRepository = dataSource.getRepository(OutfitItem);
    this.outfitRepository = dataSource.getRepository(Outfit);
    this.clothingRepository = dataSource.getRepository(Clothing);
  }

  findAll(user_id: number): Promise<OutfitItem[]> {
    return this.outfitItemRepository
      .createQueryBuilder('item')
      .innerJoin(
        Outfit,
        'outfit',
        'outfit.outfit_id = item.outfit_id AND outfit.user_id = :user_id',
        { user_id },
      )
      .getMany();
  }

  findOne(outfit_item_id: number, user_id: number): Promise<OutfitItem | null> {
    return this.outfitItemRepository
      .createQueryBuilder('item')
      .innerJoin(
        Outfit,
        'outfit',
        'outfit.outfit_id = item.outfit_id AND outfit.user_id = :user_id',
        { user_id },
      )
      .where('item.outfit_item_id = :outfit_item_id', { outfit_item_id })
      .getOne();
  }

  async create(
    data: unknown,
    user_id: number,
  ): Promise<OutfitItem> {
    const fields = this.parseFields(data);
    if (fields.outfit_id === undefined || fields.clothing_id === undefined) {
      throw new BadRequestException('outfit_id and clothing_id are required');
    }
    await this.ensureOwnedLinks(fields.outfit_id, fields.clothing_id, user_id);
    return this.outfitItemRepository.save(
      this.outfitItemRepository.create(fields),
    );
  }

  async update(
    outfit_item_id: number,
    data: unknown,
    user_id: number,
  ): Promise<OutfitItem> {
    const existing = await this.findOne(outfit_item_id, user_id);
    if (!existing) {
      throw new NotFoundException('Outfit item not found');
    }

    const fields = this.parseFields(data);
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException(
        'At least one outfit item field is required',
      );
    }
    const outfit_id = fields.outfit_id ?? existing.outfit_id;
    const clothing_id = fields.clothing_id ?? existing.clothing_id;
    await this.ensureOwnedLinks(outfit_id, clothing_id, user_id);
    const result = await this.outfitItemRepository.update(
      outfit_item_id,
      fields,
    );
    if (!result.affected) {
      throw new NotFoundException('Outfit item not found');
    }
    const updated = await this.findOne(outfit_item_id, user_id);
    if (!updated) {
      throw new NotFoundException('Outfit item not found');
    }
    return updated;
  }

  async remove(outfit_item_id: number, user_id: number): Promise<void> {
    const existing = await this.findOne(outfit_item_id, user_id);
    if (!existing) {
      throw new NotFoundException('Outfit item not found');
    }
    await this.outfitItemRepository.delete({ outfit_item_id });
  }

  private async ensureOwnedLinks(
    outfit_id: number,
    clothing_id: number,
    user_id: number,
  ): Promise<void> {
    const [outfit, clothing] = await Promise.all([
      this.outfitRepository.findOne({ where: { outfit_id, user_id } }),
      this.clothingRepository.findOne({ where: { clothing_id, user_id } }),
    ]);
    if (!outfit || !clothing) {
      throw new NotFoundException('Outfit or clothing not found');
    }
  }

  private parseFields(data: unknown): Partial<OutfitItem> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new BadRequestException('Outfit item data must be an object');
    }
    const { outfit_item_id: _id, ...fields } = data as Record<string, unknown>;
    const allowedFields = new Set(['outfit_id', 'clothing_id']);
    const unsupportedField = Object.keys(fields).find(
      (field) => !allowedFields.has(field),
    );
    if (unsupportedField) {
      throw new BadRequestException(
        `Unsupported outfit item field: ${unsupportedField}`,
      );
    }
    for (const field of ['outfit_id', 'clothing_id'] as const) {
      const value = fields[field];
      if (
        value !== undefined &&
        (typeof value !== 'number' ||
          !Number.isSafeInteger(value) ||
          value < 1)
      ) {
        throw new BadRequestException(`${field} must be a positive integer`);
      }
    }
    return fields as Partial<OutfitItem>;
  }
}
