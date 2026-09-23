import { Test, TestingModule } from '@nestjs/testing';
import { OutfitItemService } from './outfit-item.service';

describe('OutfitItemService', () => {
  let service: OutfitItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutfitItemService],
    }).compile();

    service = module.get<OutfitItemService>(OutfitItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
