import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Clothing } from './clothing.entity';

@Injectable()
export class ClothingService {
  constructor(
    @Inject('CLOTHING_REPOSITORY')
    private readonly clothingRepository: Repository<Clothing>,
  ) {}

  // Hiển thị tất cả quần áo
  async findAll(): Promise<Clothing[]> {
    return this.clothingRepository.find();
  }

  // Hiển thị một quần áo theo ID
  async findOne(clothing_id: number): Promise<Clothing | null> {
    return this.clothingRepository.findOne({
      where: { clothing_id },
    });
  }

  // Thêm quần áo
  async create(data: Partial<Clothing>): Promise<Clothing> {
    const clothing = this.clothingRepository.create(data);
    return this.clothingRepository.save(clothing);
  }

  // Cập nhật quần áo
  async update(
    clothing_id: number,
    data: Partial<Clothing>,
  ): Promise<Clothing | null> {
    await this.clothingRepository.update(clothing_id, data);

    return this.clothingRepository.findOne({
      where: { clothing_id },
    });
  }

  // Xóa quần áo
  async remove(clothing_id: number): Promise<void> {
    await this.clothingRepository.delete(clothing_id);
  }
}