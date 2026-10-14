import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClothingService } from './clothing.service';

describe('ClothingService', () => {
  let service: ClothingService;
  const repository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
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
    repository.findAndCount.mockResolvedValue([[], 0]);

    await expect(service.findAll(12)).resolves.toEqual({
      items: [],
      page: 1,
      page_size: 24,
      total: 0,
      total_pages: 0,
    });

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: [{ user_id: 12 }],
      order: { name: 'ASC', clothing_id: 'ASC' },
      skip: 0,
      take: 24,
    });
  });

  it('validates pagination and applies owner-scoped season and type filters', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await expect(
      service.findAll(12, {
        page: '2',
        page_size: '10',
        season: 'winter',
        clothing_type: 'outerwear',
      }),
    ).resolves.toMatchObject({ page: 2, page_size: 10, total: 0 });
    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: [{
        user_id: 12,
        season: 'winter',
        clothing_type: 'outerwear',
      }],
      order: { name: 'ASC', clothing_id: 'ASC' },
      skip: 10,
      take: 10,
    });
  });

  it('searches all matching clothing fields and applies a stable color sort', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll(12, { search: 'navy', sort: 'color' });

    const [options] = repository.findAndCount.mock.calls[0] as [{
      where: Record<string, unknown>[];
      order: Record<string, string>;
    }];
    expect(options.where).toHaveLength(3);
    expect(options.where.every((condition) => condition.user_id === 12)).toBe(true);
    expect(options.where.map((condition) => Object.keys(condition).filter((key) => key !== 'user_id')))
      .toEqual([['name'], ['color'], ['size']]);
    expect(options.order).toEqual({ color: 'ASC', name: 'ASC', clothing_id: 'ASC' });
  });

  it('does not update another user clothing item', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.update(9, { name: 'Changed' }, 12),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects incomplete clothing data before writing', async () => {
    await expect(service.create({ name: '  ' }, 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.create({ name: 'Coat', category_id: 0 }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid optional fields and dates before updating', async () => {
    repository.findOne.mockResolvedValue({ clothing_id: 9, user_id: 12 });

    await expect(
      service.update(9, { last_washed_at: '2026-02-30' }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(9, { color: 'x'.repeat(51) }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(9, { name: 'Changed', role: 'admin' }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('trims valid clothing names and ignores client-supplied ownership', async () => {
    const clothing = { clothing_id: 2, user_id: 12, name: 'Coat' };
    repository.create.mockReturnValue(clothing);
    repository.save.mockResolvedValue(clothing);

    await service.create(
      { name: ' Coat ', category_id: 3, user_id: 999 },
      12,
    );

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Coat',
      category_id: 3,
      user_id: 12,
    });
  });
});
