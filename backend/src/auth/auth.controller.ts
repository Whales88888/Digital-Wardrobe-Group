import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthCredentials, RegistrationData } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() data: RegistrationData,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(data);
    this.setSessionCookie(response, result.access_token, result.expires_at);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() credentials: AuthCredentials,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(credentials);
    this.setSessionCookie(response, result.access_token, result.expires_at);
    return { user: result.user };
  }

  @Public()
  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() data: { email?: unknown }) {
    if (typeof data?.email !== 'string') {
      throw new BadRequestException('A valid email address is required');
    }
    await this.authService.requestPasswordReset(data.email);
    return {
      message: 'If an account exists for that email, a reset link will be sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: { token?: unknown; password?: unknown }) {
    await this.authService.resetPassword(data?.token, data?.password);
    return { success: true };
  }

  @Get('session')
  async getSession(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.authService.getActiveSession(
      currentUser.sid,
      currentUser.sub,
    );
    if (!user) return { user: null };
    return {
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.revokeSession(currentUser.sid, currentUser.sub);
    this.clearSessionCookie(response);
    return { success: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() data: { current_password?: unknown; new_password?: unknown },
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.changePassword(
      currentUser.sub,
      data?.current_password,
      data?.new_password,
    );
    this.clearSessionCookie(response);
    return { success: true };
  }

  private setSessionCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie('dw_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
  }

  private clearSessionCookie(response: Response): void {
    response.clearCookie('dw_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
