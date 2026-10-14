import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { PasswordResetToken } from './password-reset-token.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<Pick<UserService, 'create' | 'findByEmail' | 'findByIdWithPassword' | 'updatePassword' | 'hashPassword'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let sessionRepository: {
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let resetTokenRepository: {
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByIdWithPassword: jest.fn(),
      updatePassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('hashed-password'),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    sessionRepository = {
      save: jest.fn().mockImplementation(async (session) => session),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    resetTokenRepository = {
      save: jest.fn().mockImplementation(async (token) => token),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const dataSource = {
      getRepository: jest.fn((entity: unknown) =>
        entity === PasswordResetToken ? resetTokenRepository : sessionRepository,
      ),
      transaction: jest.fn(async (callback) => callback({
        getRepository: jest.fn((entity: unknown) =>
          entity === PasswordResetToken ? resetTokenRepository : sessionRepository,
        ),
      })),
    } as unknown as DataSource;
    authService = new AuthService(
      userService as UserService,
      jwtService as JwtService,
      dataSource,
      { send: jest.fn() } as unknown as PasswordResetMailer,
    );
  });

  it('registers a user and creates a revocable session', async () => {
    userService.create.mockResolvedValue({
      user_id: 1,
      name: 'Wardrobe User',
      email: 'user@example.com',
      role: 'user',
    });

    const result = await authService.register({
      name: 'Wardrobe User',
      email: 'user@example.com',
      password: 'secure-pass-123',
    });

    expect(result).toMatchObject({
      access_token: 'signed-token',
      user: {
        user_id: 1,
        name: 'Wardrobe User',
        email: 'user@example.com',
        role: 'user',
      },
    });
    expect(result.session_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.expires_at).toBeInstanceOf(Date);
    expect(sessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 1, session_id: result.session_id }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'user@example.com',
      sid: result.session_id,
      role: 'user',
    });
  });

  it('logs in with a valid password and creates a session', async () => {
    const user = {
      user_id: 2,
      name: 'Wardrobe User',
      email: 'user@example.com',
      password: await hash('secure-pass-123', 4),
      role: 'admin',
    } as User;
    userService.findByEmail.mockResolvedValue(user);

    const result = await authService.login({
      email: ' USER@example.com ',
      password: 'secure-pass-123',
    });

    expect(result).toMatchObject({
      access_token: 'signed-token',
      user: {
        user_id: 2,
        name: 'Wardrobe User',
        email: 'user@example.com',
        role: 'admin',
      },
    });
    expect(userService.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(sessionRepository.save).toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    userService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'incorrect-pass',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('looks up active sessions and revokes a session on sign out', async () => {
    const activeSession = {
      user: { user_id: 4, role: 'user' },
    };
    sessionRepository.findOne.mockResolvedValue(activeSession);
    await expect(authService.getActiveSession('session-id', 4)).resolves.toBe(
      activeSession.user,
    );

    await authService.revokeSession('session-id', 4);
    expect(sessionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'session-id', user_id: 4 }),
      expect.objectContaining({ revoked_at: expect.any(Date) }),
    );
  });

  it('changes password only after verifying the current password and revokes all sessions', async () => {
    const user = {
      user_id: 9,
      password: await hash('current-pass-123', 4),
    } as User;
    userService.findByIdWithPassword.mockResolvedValue(user);

    await authService.changePassword(9, 'current-pass-123', 'new-password-123');

    expect(userService.updatePassword).toHaveBeenCalledWith(9, 'new-password-123');
    expect(sessionRepository.update).toHaveBeenCalledWith(
      { user_id: 9, revoked_at: expect.anything() },
      { revoked_at: expect.any(Date) },
    );
  });

  it('rejects password changes with an incorrect current password', async () => {
    userService.findByIdWithPassword.mockResolvedValue({
      user_id: 9,
      password: await hash('current-pass-123', 4),
    } as User);

    await expect(
      authService.changePassword(9, 'wrong-password', 'new-password-123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userService.updatePassword).not.toHaveBeenCalled();
    expect(sessionRepository.update).not.toHaveBeenCalled();
  });

  it('does not reveal whether an email exists when requesting password reset', async () => {
    userService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.requestPasswordReset('missing@example.com'),
    ).resolves.toBeUndefined();
    expect(resetTokenRepository.save).not.toHaveBeenCalled();
  });

  it('rejects malformed reset tokens without changing passwords', async () => {
    await expect(
      authService.resetPassword('short', 'new-password-123'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userService.hashPassword).not.toHaveBeenCalled();
  });
});
