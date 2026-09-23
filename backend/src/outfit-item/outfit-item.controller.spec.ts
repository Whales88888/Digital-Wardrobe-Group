import { Test, TestingModule } from '@nestjs/testing';
import { OutfitItemController } from './outfit-item.controller';

describe('OutfitItemController', () => {
  let controller: OutfitItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutfitItemController],
    }).compile();

    controller = module.get<OutfitItemController>(OutfitItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
