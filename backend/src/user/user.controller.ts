import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { UserService, type ProfileUpdate } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.findOne(user.sub);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ProfileUpdate,
  ) {
    return this.userService.update(user.sub, data);
  }
}
