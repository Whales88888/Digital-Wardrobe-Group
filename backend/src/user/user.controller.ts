import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserService, type PageQuery, type ProfileUpdate } from './user.service';

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

  @Get('admin')
  @Roles('admin')
  listUsers(@Query() query: PageQuery) {
    return this.userService.listUsers(query);
  }

  @Patch('admin/:id/role')
  @Roles('admin')
  changeRole(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: { role?: unknown },
  ) {
    return this.userService.changeRole(Number(id), user.sub, data?.role);
  }

  @Delete('admin/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.userService.deleteUser(Number(id), user.sub);
  }
}
