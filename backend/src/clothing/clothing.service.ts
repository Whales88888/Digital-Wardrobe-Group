import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Clothing } from './clothing.entity';

@Injectable()
export class ClothingService {
  constructor(
    @Inject('CLOTHING_REPOSITORY')
    private readonly clothingRepository: Repository<Clothing>,
  ) {}

  async findAll(user_id: number): Promise<Clothing[]> {
    return this.clothingRepository.find({ where: { user_id } });
  }

  async findOne(
    clothing_id: number,
    user_id: number,
  ): Promise<Clothing | null> {
    return this.clothingRepository.findOne({
      where: { clothing_id, user_id },
    });
  }

  async create(data: Partial<Clothing>, user_id: number): Promise<Clothing> {
    const { clothing_id: _id, user_id: _owner, ...fields } = data;
    const clothing = this.clothingRepository.create({ ...fields, user_id });
    return this.clothingRepository.save(clothing);
  }

  async update(
    clothing_id: number,
    data: Partial<Clothing>,
    user_id: number,
  ): Promise<Clothing | null> {
    const existing = await this.findOne(clothing_id, user_id);
    if (!existing) {
      throw new NotFoundException('Clothing not found');
    }

    const { clothing_id: _id, user_id: _owner, ...fields } = data;
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
}
