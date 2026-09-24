import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findOne(id: number): Promise<OutfitItem> {
    const outfitItem = await this.outfitItemRepository.findOne({
      where: { outfit_item_id: id },
    });

    if (!outfitItem) {
      throw new NotFoundException(
        `Outfit item ${id} not found`,
      );
    }

    return outfitItem;
  }

  async create(
    data: Partial<OutfitItem>,
  ): Promise<OutfitItem> {
    const outfitItem =
      this.outfitItemRepository.create(data);

    return this.outfitItemRepository.save(outfitItem);
  }

  async update(
    id: number,
    data: Partial<OutfitItem>,
  ): Promise<OutfitItem> {
    const outfitItem = await this.findOne(id);

    Object.assign(outfitItem, data);

    return this.outfitItemRepository.save(outfitItem);
  }

  async remove(id: number): Promise<void> {
    const outfitItem = await this.findOne(id);

    await this.outfitItemRepository.remove(outfitItem);
  }
}