import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let request: { headers: { authorization?: string; cookie?: string }; user?: unknown };
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let authService: jest.Mocked<Pick<AuthService, 'getActiveSession'>>;
  let clearCookie: jest.Mock;
  let context: ExecutionContext;

  beforeEach(() => {
    request = { headers: {} };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    jwtService = {
      verifyAsync: jest.fn(),
    };
    authService = {
      getActiveSession: jest.fn(),
    };
    clearCookie = jest.fn();
    guard = new JwtAuthGuard(
      jwtService as JwtService,
      reflector as Reflector,
      authService as AuthService,
    );
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ clearCookie }),
      }),
    } as unknown as ExecutionContext;
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects requests without a cookie or bearer token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('verifies the HttpOnly session cookie and attaches the current role', async () => {
    request.headers.cookie = 'dw_session=signed-cookie';
    jwtService.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'old@example.com',
      sid: 'session-id',
      role: 'user',
    });
    authService.getActiveSession.mockResolvedValue({
      user_id: 7,
      email: 'user@example.com',
      role: 'admin',
    } as User);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('signed-cookie');
    expect(request.user).toEqual({
      sub: 7,
      email: 'user@example.com',
      sid: 'session-id',
      role: 'admin',
    });
  });

  it('rejects a revoked session and clears its cookie', async () => {
    request.headers.cookie = 'dw_session=signed-cookie';
    jwtService.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'user@example.com',
      sid: 'revoked-session',
      role: 'user',
    });
    authService.getActiveSession.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(clearCookie).toHaveBeenCalledWith('dw_session', expect.any(Object));
  });
});
