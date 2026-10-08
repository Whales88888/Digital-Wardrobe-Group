import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let request: { headers: { authorization?: string }; user?: unknown };
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let context: ExecutionContext;

  beforeEach(() => {
    request = { headers: {} };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    jwtService = {
      verifyAsync: jest.fn(),
    };
    guard = new JwtAuthGuard(jwtService as JwtService, reflector as Reflector);
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  });

  it('allows public routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('verifies a bearer token and attaches its user payload', async () => {
    request.headers.authorization = 'Bearer valid-token';
    jwtService.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'user@example.com',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 7, email: 'user@example.com' });
  });
});
