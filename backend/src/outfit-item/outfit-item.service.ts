import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OutfitItem } from './outfit-item.entity';

@Injectable()
export class OutfitItemService {
  constructor(
    @Inject('OUTFIT_ITEM_REPOSITORY')
    private readonly outfitItemRepository: Repository<OutfitItem>,
  ) {}

  // Hiển thị tất cả outfit items
  async findAll(): Promise<OutfitItem[]> {
    return this.outfitItemRepository.find();
  }

  // Hiển thị một outfit item theo ID
  async findOne(outfit_item_id: number): Promise<OutfitItem | null> {
    return this.outfitItemRepository.findOne({
      where: { outfit_item_id },
    });
  }

  // Thêm outfit item
  async create(data: Partial<OutfitItem>): Promise<OutfitItem> {
    const outfitItem = this.outfitItemRepository.create(data);
    return this.outfitItemRepository.save(outfitItem);
  }

  // Cập nhật outfit item
  async update(
    outfit_item_id: number,
    data: Partial<OutfitItem>,
  ): Promise<OutfitItem | null> {
    await this.outfitItemRepository.update(outfit_item_id, data);

    return this.findOne(outfit_item_id);
  }

  // Xóa outfit item
  async remove(outfit_item_id: number): Promise<void> {
    await this.outfitItemRepository.delete(outfit_item_id);
  }
}