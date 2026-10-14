import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedUser } from './current-user.decorator';
import { AuthService } from './auth.service';
type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const authorizationParts = authorization?.trim().split(/\s+/) ?? [];
    const [scheme, token] = authorizationParts;
    const cookieToken = this.getSessionCookie(request.headers.cookie);
    const credential = cookieToken ?? (
      authorizationParts.length === 2 && scheme === 'Bearer' ? token : null
    );
    if (!credential) {
      throw new UnauthorizedException('Bearer token is required');
    }

    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthenticatedUser>(credential);
    } catch (error) {
      if (
        error instanceof Error &&
        ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(
          error.name,
        )
      ) {
        this.clearSessionCookie(context);
        throw new UnauthorizedException('Invalid or expired bearer token');
      }
      throw error;
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      typeof payload.email !== 'string' ||
      typeof payload.sid !== 'string' ||
      !['user', 'admin'].includes(payload.role)
    ) {
      this.clearSessionCookie(context);
      throw new UnauthorizedException('Invalid bearer token');
    }

    const sessionUser = await this.authService.getActiveSession(
      payload.sid,
      payload.sub,
    );
    if (!sessionUser) {
      this.clearSessionCookie(context);
      throw new UnauthorizedException('Session is invalid or expired');
    }
    payload.email = sessionUser.email;
    payload.role = sessionUser.role;
    request.user = payload;

    return true;
  }

  private getSessionCookie(cookieHeader?: string): string | null {
    const values = (cookieHeader ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('dw_session='));
    if (values.length !== 1) return null;
    return values[0].slice('dw_session='.length) || null;
  }

  private clearSessionCookie(context: ExecutionContext): void {
    const response = context.switchToHttp().getResponse<{
      clearCookie: (name: string, options: object) => void;
    }>();
    response.clearCookie('dw_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
