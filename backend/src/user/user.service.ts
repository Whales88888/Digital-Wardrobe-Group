import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from './user.entity';

export type PublicUser = Omit<User, 'password'>;

export interface PageQuery {
  page?: string;
  page_size?: string;
}

export interface UserPage {
  items: PublicUser[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

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

  async findByIdWithPassword(user_id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { user_id } });
  }

  async listUsers(query: PageQuery): Promise<UserPage> {
    const page = this.parsePage(query.page, 1, 'page');
    const page_size = this.parsePage(query.page_size, 20, 'page_size');
    if (page_size > 100 || page > Math.floor(Number.MAX_SAFE_INTEGER / page_size)) {
      throw new BadRequestException('Pagination is outside the supported range');
    }
    const [items, total] = await this.userRepository.findAndCount({
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
      },
      order: { user_id: 'ASC' },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    return {
      items,
      page,
      page_size,
      total,
      total_pages: Math.ceil(total / page_size),
    };
  }

  async changeRole(
    target_user_id: number,
    actor_user_id: number,
    role: unknown,
  ): Promise<PublicUser> {
    if (!Number.isSafeInteger(target_user_id) || target_user_id < 1) {
      throw new BadRequestException('Invalid user ID');
    }
    if (role !== 'user' && role !== 'admin') {
      throw new BadRequestException('Role must be user or admin');
    }
    if (target_user_id === actor_user_id && role === 'user') {
      throw new BadRequestException('You cannot remove your own administrator role');
    }
    const user = await this.userRepository.findOne({
      where: { user_id: target_user_id },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin' && role === 'user') {
      const admins = await this.userRepository.count({ where: { role: 'admin' } });
      if (admins <= 1) {
        throw new ConflictException('At least one administrator must remain');
      }
    }
    await this.userRepository.update(target_user_id, { role });
    const updated = await this.findOne(target_user_id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async deleteUser(target_user_id: number, actor_user_id: number): Promise<void> {
    if (!Number.isSafeInteger(target_user_id) || target_user_id < 1) {
      throw new BadRequestException('Invalid user ID');
    }
    if (target_user_id === actor_user_id) {
      throw new BadRequestException('You cannot delete your own administrator account');
    }
    const user = await this.userRepository.findOne({
      where: { user_id: target_user_id },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      const admins = await this.userRepository.count({ where: { role: 'admin' } });
      if (admins <= 1) {
        throw new ConflictException('At least one administrator must remain');
      }
    }
    await this.userRepository.delete(target_user_id);
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
    value: unknown,
  ): Promise<PublicUser | null> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('Profile data must be an object');
    }
    const data = value as ProfileUpdate;
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
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('At least one user field must be provided');
    }
    await this.userRepository.update(user_id, updates);
    return this.findOne(user_id);
  }

  async updatePassword(user_id: number, password: string): Promise<void> {
    const hashedPassword = await this.hashPassword(password);
    await this.userRepository.update(user_id, { password: hashedPassword });
  }

  async hashPassword(password: string): Promise<string> {
    return hash(this.requirePassword(password), 12);
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

  private parsePage(value: string | undefined, fallback: number, field: string): number {
    if (value === undefined) return fallback;
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new BadRequestException(`${field} is outside the supported range`);
    }
    return parsed;
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
