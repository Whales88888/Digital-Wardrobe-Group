import { Test, TestingModule } from '@nestjs/testing';
import { OutfitController } from './outfit.controller';

describe('OutfitController', () => {
  let controller: OutfitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutfitController],
    }).compile();

    controller = module.get<OutfitController>(OutfitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
