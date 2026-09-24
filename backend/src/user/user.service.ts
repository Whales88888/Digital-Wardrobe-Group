import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  // Hiển thị tất cả users
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Hiển thị một user theo ID
  async findOne(user_id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { user_id },
    });
  }

  // Thêm user
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  // Cập nhật user
  async update(
    user_id: number,
    data: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update(user_id, data);

    return this.findOne(user_id);
  }

  // Xóa user
  async remove(user_id: number): Promise<void> {
    await this.userRepository.delete(user_id);
  }
}