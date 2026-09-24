import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OutfitItem } from './outfit-item.entity';

@Injectable()
export class OutfitItemService {
  constructor(
    @Inject('OUTFIT_ITEM_REPOSITORY')
    private readonly outfitItemRepository: Repository<OutfitItem>,
  ) {}

  async findAll(): Promise<OutfitItem[]> {
    return this.outfitItemRepository.find();
  }

  async findOne(outfit_item_id: number): Promise<OutfitItem | null> {
    return this.outfitItemRepository.findOne({
      where: { outfit_item_id },
    });
  }

  async create(data: Partial<OutfitItem>): Promise<OutfitItem> {
    const outfitItem = this.outfitItemRepository.create(data);
    return this.outfitItemRepository.save(outfitItem);
  }

  async update(
    outfit_item_id: number,
    data: Partial<OutfitItem>,
  ): Promise<OutfitItem | null> {
    await this.outfitItemRepository.update(outfit_item_id, data);
    return this.findOne(outfit_item_id);
  }

  async remove(outfit_item_id: number): Promise<void> {
    await this.outfitItemRepository.delete(outfit_item_id);
  }
}