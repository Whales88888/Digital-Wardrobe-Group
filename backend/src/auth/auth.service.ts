import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import { UserService } from '../user/user.service';
import { Session } from './session.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { User } from '../user/user.entity';

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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject('DATA_SOURCE') private readonly dataSource: DataSource,
    private readonly passwordResetMailer: PasswordResetMailer,
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

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('A valid email address is required');
    }
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    const token_hash = createHash('sha256').update(token).digest('hex');
    const repository = this.dataSource.getRepository(PasswordResetToken);
    await repository.update(
      { user_id: user.user_id, used_at: IsNull() },
      { used_at: new Date() },
    );
    await repository.save({
      user_id: user.user_id,
      token_hash,
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
      used_at: null,
    });
    try {
      await this.passwordResetMailer.send(user.email, user.name, token);
    } catch (error) {
      await repository.update({ token_hash }, { used_at: new Date() });
      this.logger.error(
        `Could not deliver password reset email (${error instanceof Error ? error.name : 'unknown error'})`,
      );
    }
  }

  async resetPassword(token: unknown, newPassword: unknown): Promise<void> {
    if (typeof token !== 'string' || token.length < 32 || token.length > 100) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    if (typeof newPassword !== 'string') {
      throw new BadRequestException('A new password is required');
    }
    const token_hash = createHash('sha256').update(token).digest('hex');
    const repository = this.dataSource.getRepository(PasswordResetToken);
    const resetToken = await repository.findOne({
      where: {
        token_hash,
        expires_at: MoreThan(new Date()),
        used_at: IsNull(),
      },
    });
    if (!resetToken) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    const hashedPassword = await this.userService.hashPassword(newPassword);

    await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(PasswordResetToken);
      const claim = await tokenRepository.update(
        {
          password_reset_token_id: resetToken.password_reset_token_id,
          expires_at: MoreThan(new Date()),
          used_at: IsNull(),
        },
        { used_at: new Date() },
      );
      if (!claim.affected) {
        throw new BadRequestException('Invalid or expired password reset token');
      }
      await manager.getRepository(User).update(
        { user_id: resetToken.user_id },
        { password: hashedPassword },
      );
      await manager.getRepository(Session).update(
        { user_id: resetToken.user_id, revoked_at: IsNull() },
        { revoked_at: new Date() },
      );
      await tokenRepository.update(
        { user_id: resetToken.user_id, used_at: IsNull() },
        { used_at: new Date() },
      );
    });
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
