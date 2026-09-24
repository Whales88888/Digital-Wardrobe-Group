import {
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

  async findAll(): Promise<Outfit[]> {
    return this.outfitRepository.find();
  }

  async findOne(id: number): Promise<Outfit> {
    const outfit = await this.outfitRepository.findOne({
      where: { outfit_id: id },
    });

    if (!outfit) {
      throw new NotFoundException(`Outfit ${id} not found`);
    }

    return outfit;
  }

  async create(data: Partial<Outfit>): Promise<Outfit> {
    const outfit = this.outfitRepository.create(data);
    return this.outfitRepository.save(outfit);
  }

  async update(
    id: number,
    data: Partial<Outfit>,
  ): Promise<Outfit> {
    const outfit = await this.findOne(id);

    Object.assign(outfit, data);

    return this.outfitRepository.save(outfit);
  }

  async remove(id: number): Promise<void> {
    const outfit = await this.findOne(id);

    await this.outfitRepository.remove(outfit);
  }
}