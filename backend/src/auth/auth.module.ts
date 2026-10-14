import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import type { DataSource } from 'typeorm';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { CsrfGuard } from './csrf.guard';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { DatabaseThrottlerStorage } from './database-throttler.storage';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ThrottlerModule.forRootAsync({
      imports: [DatabaseModule],
      inject: ['DATA_SOURCE'],
      useFactory: (dataSource: DataSource) => ({
        throttlers: [{ ttl: 60_000, limit: 5 }],
        storage: new DatabaseThrottlerStorage(dataSource),
      }),
    }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET must be set to at least 32 characters');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetMailer,
    JwtAuthGuard,
    RolesGuard,
    CsrfGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
    { provide: APP_GUARD, useExisting: CsrfGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
