import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UserService } from '../user/user.service';

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

  private async createAuthResponse(user: {
    user_id: number;
    name: string;
    email: string;
  }) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.user_id,
      email: user.email,
    });
    return { access_token: accessToken, user };
  }
}
