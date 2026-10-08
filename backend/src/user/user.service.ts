import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from './user.entity';

export type PublicUser = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  // Hiển thị tất cả users
  async findAll(): Promise<PublicUser[]> {
    return (await this.userRepository.find()).map(
      ({ password: _password, ...user }) => user,
    );
  }

  // Hiển thị một user theo ID
  async findOne(user_id: number): Promise<PublicUser | null> {
    const user = await this.userRepository.findOne({ where: { user_id } });
    if (!user) {
      return null;
    }
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<PublicUser> {
    const email = this.normalizeEmail(data.email);
    const name = this.requireName(data.name);
    const password = this.requirePassword(data.password);
    await this.ensureEmailAvailable(email);

    const user = this.userRepository.create({
      name,
      email,
      password: await hash(password, 12),
    });
    const savedUser = await this.userRepository.save(user);
    const { password: _password, ...publicUser } = savedUser;
    return publicUser;
  }

  async update(
    user_id: number,
    data: Partial<User>,
  ): Promise<PublicUser | null> {
    const existingUser = await this.userRepository.findOne({
      where: { user_id },
    });
    if (!existingUser) {
      return null;
    }

    const updates: Partial<User> = {};
    if (data.name !== undefined) {
      updates.name = this.requireName(data.name);
    }
    if (data.email !== undefined) {
      updates.email = this.normalizeEmail(data.email);
      await this.ensureEmailAvailable(updates.email, user_id);
    }
    if (data.password !== undefined) {
      updates.password = await hash(this.requirePassword(data.password), 12);
    }
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('At least one user field must be provided');
    }
    await this.userRepository.update(user_id, updates);
    return this.findOne(user_id);
  }

  async remove(user_id: number): Promise<void> {
    await this.userRepository.delete(user_id);
  }

  private normalizeEmail(email: string | undefined): string {
    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BadRequestException('A valid email address is required');
    }
    return email.trim().toLowerCase();
  }

  private requireName(name: string | undefined): string {
    if (
      typeof name !== 'string' ||
      name.trim().length === 0 ||
      name.length > 100
    ) {
      throw new BadRequestException(
        'Name must contain between 1 and 100 characters',
      );
    }
    return name.trim();
  }

  private requirePassword(password: string | undefined): string {
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      throw new BadRequestException(
        'Password must contain at least 8 characters and no more than 72 UTF-8 bytes',
      );
    }
    return password;
  }

  private async ensureEmailAvailable(
    email: string,
    exceptUserId?: number,
  ): Promise<void> {
    const existingUser = await this.findByEmail(email);
    if (existingUser && existingUser.user_id !== exceptUserId) {
      throw new ConflictException('An account with this email already exists');
    }
  }
}
