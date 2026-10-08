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
    data: Partial<OutfitItem>,
    user_id: number,
  ): Promise<OutfitItem> {
    const { outfit_item_id: _id, ...fields } = data;
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
    data: Partial<OutfitItem>,
    user_id: number,
  ): Promise<OutfitItem> {
    const existing = await this.findOne(outfit_item_id, user_id);
    if (!existing) {
      throw new NotFoundException('Outfit item not found');
    }

    const { outfit_item_id: _id, ...fields } = data;
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
}
