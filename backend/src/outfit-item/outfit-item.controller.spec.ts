import { Test, TestingModule } from '@nestjs/testing';
import { OutfitItemController } from './outfit-item.controller';
import { OutfitItemService } from './outfit-item.service';

describe('OutfitItemController', () => {
  let controller: OutfitItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutfitItemController],
      providers: [{ provide: OutfitItemService, useValue: {} }],
    }).compile();

    controller = module.get<OutfitItemController>(OutfitItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
