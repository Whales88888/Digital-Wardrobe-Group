import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OutfitService } from './outfit.service';

describe('OutfitService', () => {
  let service: OutfitService;
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((outfit) => outfit),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutfitService,
        { provide: 'OUTFIT_REPOSITORY', useValue: repository },
      ],
    })
      .compile();

    service = module.get<OutfitService>(OutfitService);
  });

  it('requires a valid name and rejects unsupported fields', async () => {
    await expect(service.create({ name: ' ' }, 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.create({ name: 'Work', role: 'admin' }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('trims the outfit name and forces the authenticated owner on create', async () => {
    repository.save.mockResolvedValue({
      name: 'Work',
      user_id: 12,
    });

    await service.create(
      { name: ' Work ', description: null, user_id: 999 },
      12,
    );

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Work',
      description: null,
      user_id: 12,
    });
  });
});
