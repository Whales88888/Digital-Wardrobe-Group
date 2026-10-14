import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  const repository = {
    findOne: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: 'CATEGORY_REPOSITORY', useValue: repository },
        { provide: 'DATA_SOURCE', useValue: dataSource },
      ],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not delete categories which are still used by clothing', async () => {
    repository.findOne.mockResolvedValue({ category_id: 3, name: 'Dresses' });
    dataSource.query.mockResolvedValue([{ count: '2' }]);

    await expect(service.remove(3)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('allows deleting unused categories', async () => {
    repository.findOne.mockResolvedValue({ category_id: 3, name: 'Dresses' });
    dataSource.query.mockResolvedValue([{ count: '0' }]);
    repository.delete.mockResolvedValue({ affected: 1 });

    await service.remove(3);

    expect(repository.delete).toHaveBeenCalledWith(3);
  });
});
