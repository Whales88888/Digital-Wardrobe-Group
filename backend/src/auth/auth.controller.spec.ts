import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const user = {
    user_id: 12,
    name: 'Wardrobe User',
    email: 'user@example.com',
    role: 'user' as const,
  };
  let authService: jest.Mocked<
    Pick<AuthService, 'register' | 'login' | 'revokeSession'>
  >;
  let controller: AuthController;
  let response: jest.Mocked<
    Pick<Response, 'cookie' | 'clearCookie'>
  >;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      revokeSession: jest.fn(),
    };
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    controller = new AuthController(authService as AuthService);
  });

  it('sets an HttpOnly short-lived cookie without returning the JWT', async () => {
    const expires_at = new Date(Date.now() + 15 * 60 * 1000);
    authService.register.mockResolvedValue({
      access_token: 'signed-token',
      expires_at,
      session_id: 'session-id',
      user,
    });

    await expect(
      controller.register(
        { name: user.name, email: user.email, password: 'valid-pass-123' },
        response as Response,
      ),
    ).resolves.toEqual({ user });
    expect(response.cookie).toHaveBeenCalledWith(
      'dw_session',
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        expires: expires_at,
        path: '/',
      }),
    );
  });

  it('revokes the current session and clears its cookie on sign out', async () => {
    await expect(
      controller.logout(
        { sub: user.user_id, sid: 'session-id', email: user.email, role: 'user' },
        response as Response,
      ),
    ).resolves.toEqual({ success: true });

    expect(authService.revokeSession).toHaveBeenCalledWith(
      'session-id',
      user.user_id,
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'dw_session',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });
});
