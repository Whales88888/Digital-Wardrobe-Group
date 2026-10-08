import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Clothing } from '../clothing/clothing.entity';
import { Outfit } from '../outfit/outfit.entity';
import { OutfitItem } from './outfit-item.entity';
import { OutfitItemService } from './outfit-item.service';

describe('OutfitItemService', () => {
  let service: OutfitItemService;
  const outfitRepository = { findOne: jest.fn() };
  const clothingRepository = { findOne: jest.fn() };
  const itemRepository = {
    create: jest.fn((item) => item),
    save: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Outfit) return outfitRepository;
      if (entity === Clothing) return clothingRepository;
      if (entity === OutfitItem) return itemRepository;
      throw new Error('Unexpected repository');
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutfitItemService,
        { provide: 'DATA_SOURCE', useValue: dataSource },
      ],
    }).compile();

    service = module.get<OutfitItemService>(OutfitItemService);
  });

  it('rejects linking an outfit owned by a different user', async () => {
    outfitRepository.findOne.mockResolvedValue(null);
    clothingRepository.findOne.mockResolvedValue({ clothing_id: 5 });

    await expect(
      service.create({ outfit_id: 3, clothing_id: 5 }, 12),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(itemRepository.save).not.toHaveBeenCalled();
  });
});
