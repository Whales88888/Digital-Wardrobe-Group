import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActivityService } from './activity.service';
import { Clothing } from '../clothing/clothing.entity';
import { Outfit } from '../outfit/outfit.entity';

describe('ActivityService', () => {
  const clothingRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };
  const outfitRepository = { findOne: jest.fn() };
  const outfitItemRepository = { find: jest.fn() };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Clothing) return clothingRepository;
      if (entity === Outfit) return outfitRepository;
      return outfitItemRepository;
    }),
    query: jest.fn(),
    transaction: jest.fn(),
  };
  let service: ActivityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivityService(dataSource as unknown as DataSource);
  });

  it('rejects invalid dates before accessing persistence', async () => {
    await expect(service.createLog({
      worn_on: '2026-02-30',
      clothing_ids: [1],
    }, 8)).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });

  it('rejects clothing items that are not owned by the current user', async () => {
    clothingRepository.count.mockResolvedValue(0);

    await expect(service.createLog({
      worn_on: '2026-10-14',
      clothing_ids: [17],
    }, 8)).rejects.toBeInstanceOf(NotFoundException);
    expect(clothingRepository.count).toHaveBeenCalledWith({
      where: [{ clothing_id: 17, user_id: 8 }],
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('filters plans to the requested calendar month', async () => {
    await service.getPlans(8, '2026-10-01', '2026-10-31');

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('plans.planned_for >= ? AND plans.planned_for <= ?'),
      [8, '2026-10-01', '2026-10-31'],
    );
    expect(dataSource.query.mock.calls[0][0]).not.toContain('LIMIT 200');
  });

  it('rejects invalid or unbounded plan date filters', async () => {
    await expect(service.getPlans(8, '2026-02-30', '2026-03-01'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getPlans(8, '2026-01-01'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('builds seasonal outfit suggestions from owned pieces', async () => {
    const season = new Date().getUTCMonth() + 1;
    const seasonName = season >= 3 && season <= 5 ? 'spring'
      : season >= 6 && season <= 8 ? 'summer'
        : season >= 9 && season <= 11 ? 'autumn' : 'winter';
    dataSource.query.mockResolvedValue([{
      clothing_id: 1,
      name: 'Soft shirt',
      color: 'Cream',
      season: seasonName,
      clothing_type: 'top',
      category_name: 'Tops',
      wear_count: 1,
    }, {
      clothing_id: 2,
      name: 'Wide trousers',
      color: 'Navy',
      season: 'all-season',
      clothing_type: 'bottom',
      category_name: 'Bottoms',
      wear_count: 0,
    }, {
      clothing_id: 3,
      name: 'Spring dress',
      color: 'Rose',
      season: seasonName === 'spring' ? 'winter' : 'spring',
      clothing_type: 'dress',
      category_name: 'Dresses',
      wear_count: 0,
    }]);

    await expect(service.getRecommendations(8)).resolves.toEqual({
      season: seasonName,
      recommendations: [{
        items: [
          { clothing_id: 1, name: 'Soft shirt', color: 'Cream', clothing_type: 'top' },
          { clothing_id: 2, name: 'Wide trousers', color: 'Navy', clothing_type: 'bottom' },
        ],
        reason: `Pairs a ${seasonName}-ready top and bottom; less-worn pieces rank first.`,
      }],
    });
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('WHERE clothing.user_id = ?'), [8]);
  });
});
