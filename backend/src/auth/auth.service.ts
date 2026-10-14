import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import { UserService } from '../user/user.service';
import { Session } from './session.entity';
import type { User } from '../user/user.entity';

const SESSION_DURATION_MS = 15 * 60 * 1000;

export interface AuthResult {
  access_token: string;
  expires_at: Date;
  session_id: string;
  user: Pick<User, 'user_id' | 'name' | 'email' | 'role'>;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends AuthCredentials {
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject('DATA_SOURCE') private readonly dataSource: DataSource,
  ) {}

  async register(data: RegistrationData) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Registration data is required');
    }
    const user = await this.userService.create(data);
    return this.createAuthResponse(user);
  }

  async login(credentials: AuthCredentials) {
    if (
      !credentials ||
      typeof credentials.email !== 'string' ||
      typeof credentials.password !== 'string'
    ) {
      throw new BadRequestException('Email and password are required');
    }
    const email = credentials.email.trim().toLowerCase();
    const user = await this.userService.findByEmail(email);
    const passwordMatches = user
      ? await compare(credentials.password, user.password)
      : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, ...publicUser } = user;
    return this.createAuthResponse(publicUser);
  }

  async changePassword(user_id: number, currentPassword: unknown, newPassword: unknown): Promise<void> {
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      throw new BadRequestException('Current and new passwords are required');
    }
    const user = await this.userService.findByIdWithPassword(user_id);
    if (!user || !(await compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.userService.updatePassword(user_id, newPassword);
    await this.dataSource.getRepository(Session).update(
      { user_id, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  async getActiveSession(
    session_id: string,
    user_id: number,
  ): Promise<User | null> {
    const sessionRepository = this.dataSource.getRepository(Session);
    const session = await sessionRepository.findOne({
      where: {
        session_id,
        user_id,
        expires_at: MoreThan(new Date()),
        revoked_at: IsNull(),
      },
      relations: { user: true },
    });
    return session?.user ?? null;
  }

  async revokeSession(session_id: string, user_id: number): Promise<void> {
    await this.dataSource.getRepository(Session).update(
      { session_id, user_id, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  private async createAuthResponse(user: {
    user_id: number;
    name: string;
    email: string;
    role: User['role'];
  }): Promise<AuthResult> {
    const session_id = randomUUID();
    const expires_at = new Date(Date.now() + SESSION_DURATION_MS);
    await this.dataSource.getRepository(Session).save({
      session_id,
      user_id: user.user_id,
      expires_at,
      revoked_at: null,
    });
    const accessToken = await this.jwtService.signAsync({
      sub: user.user_id,
      email: user.email,
      sid: session_id,
      role: user.role,
    });
    return {
      access_token: accessToken,
      expires_at,
      session_id,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
