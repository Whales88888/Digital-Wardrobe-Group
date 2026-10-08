import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<Pick<UserService, 'create' | 'findByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    authService = new AuthService(
      userService as UserService,
      jwtService as JwtService,
    );
  });

  it('registers a user and returns a signed token without a password', async () => {
    userService.create.mockResolvedValue({
      user_id: 1,
      name: 'Wardrobe User',
      email: 'user@example.com',
    });

    await expect(
      authService.register({
        name: 'Wardrobe User',
        email: 'user@example.com',
        password: 'secure-pass-123',
      }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      user: {
        user_id: 1,
        name: 'Wardrobe User',
        email: 'user@example.com',
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'user@example.com',
    });
  });

  it('logs in with a valid password', async () => {
    const user = {
      user_id: 2,
      name: 'Wardrobe User',
      email: 'user@example.com',
      password: await hash('secure-pass-123', 4),
    } as User;
    userService.findByEmail.mockResolvedValue(user);

    await expect(
      authService.login({
        email: ' USER@example.com ',
        password: 'secure-pass-123',
      }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      user: {
        user_id: 2,
        name: 'Wardrobe User',
        email: 'user@example.com',
      },
    });
    expect(userService.findByEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('rejects invalid credentials', async () => {
    userService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'incorrect-pass',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
