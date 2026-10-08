import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClothingService } from './clothing.service';

describe('ClothingService', () => {
  let service: ClothingService;
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClothingService,
        { provide: 'CLOTHING_REPOSITORY', useValue: repository },
      ],
    }).compile();

    service = module.get<ClothingService>(ClothingService);
  });

  it('only lists clothing owned by the authenticated user', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAll(12);

    expect(repository.find).toHaveBeenCalledWith({ where: { user_id: 12 } });
  });

  it('does not update another user clothing item', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.update(9, { name: 'Changed' }, 12),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
