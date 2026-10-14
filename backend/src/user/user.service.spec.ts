import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const repository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'USER_REPOSITORY', useValue: repository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('paginates accounts without selecting password hashes', async () => {
    const account = { user_id: 4, name: 'Wardrobe User', email: 'user@example.com', role: 'user' };
    repository.findAndCount.mockResolvedValue([[account], 21]);

    await expect(service.listUsers({ page: '2' })).resolves.toEqual({
      items: [account],
      page: 2,
      page_size: 20,
      total: 21,
      total_pages: 2,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith({
      select: { user_id: true, name: true, email: true, role: true },
      order: { user_id: 'ASC' },
      skip: 20,
      take: 20,
    });
  });

  it('rejects self-demotion and protects the last administrator', async () => {
    await expect(service.changeRole(1, 1, 'user')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    repository.findOne.mockResolvedValue({
      user_id: 2,
      name: 'Last Admin',
      email: 'admin@example.com',
      role: 'admin',
      password: 'hash',
    });
    repository.count.mockResolvedValue(1);
    await expect(service.changeRole(2, 1, 'user')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('prevents self-deletion and deleting the last administrator', async () => {
    await expect(service.deleteUser(1, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    repository.findOne.mockResolvedValue({
      user_id: 2,
      name: 'Last Admin',
      email: 'admin@example.com',
      role: 'admin',
      password: 'hash',
    });
    repository.count.mockResolvedValue(1);
    await expect(service.deleteUser(2, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
