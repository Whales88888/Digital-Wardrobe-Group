import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.activityService.getDashboard(user.sub);
  }

  @Get('recommendations')
  getRecommendations(@CurrentUser() user: AuthenticatedUser) {
    return this.activityService.getRecommendations(user.sub);
  }

  @Get('logs')
  getLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.activityService.getLogs(user.sub);
  }

  @Post('logs')
  createLog(
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.createLog(data, user.sub);
  }

  @Delete('logs/:id')
  removeLog(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.removeLog(Number(id), user.sub);
  }

  @Patch('logs/:id')
  updateLog(
    @Param('id') id: string,
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.updateLog(Number(id), data, user.sub);
  }

  @Get('plans')
  getPlans(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.activityService.getPlans(user.sub, from, to);
  }

  @Post('plans')
  createPlan(
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.createPlan(data, user.sub);
  }

  @Delete('plans/:id')
  removePlan(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.removePlan(Number(id), user.sub);
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.updatePlan(Number(id), data, user.sub);
  }

  @Patch('clothing/:id/care')
  updateCare(
    @Param('id') id: string,
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activityService.updateCare(Number(id), data, user.sub);
  }
}
