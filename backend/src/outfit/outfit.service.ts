import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Outfit } from './outfit.entity';

@Injectable()
export class OutfitService {
  constructor(
    @Inject('OUTFIT_REPOSITORY')
    private readonly outfitRepository: Repository<Outfit>,
  ) {}

  findAll(user_id: number) {
    return this.outfitRepository.find({ where: { user_id } });
  }

  findOne(outfit_id: number, user_id: number) {
    return this.outfitRepository.findOne({ where: { outfit_id, user_id } });
  }

  create(data: Partial<Outfit>, user_id: number) {
    const { outfit_id: _id, user_id: _owner, ...fields } = data;
    return this.outfitRepository.save(
      this.outfitRepository.create({ ...fields, user_id }),
    );
  }

  async update(outfit_id: number, data: Partial<Outfit>, user_id: number) {
    const existing = await this.findOne(outfit_id, user_id);
    if (!existing) {
      throw new NotFoundException('Outfit not found');
    }

    const { outfit_id: _id, user_id: _owner, ...fields } = data;
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
}
