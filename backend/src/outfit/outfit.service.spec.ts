import { Test, TestingModule } from '@nestjs/testing';
import { OutfitService } from './outfit.service';

describe('OutfitService', () => {
  let service: OutfitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutfitService],
    }).compile();

    service = module.get<OutfitService>(OutfitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
