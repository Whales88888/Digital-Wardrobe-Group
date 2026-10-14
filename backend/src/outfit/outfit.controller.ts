import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { Outfit } from './outfit.entity';
import { OutfitService } from './outfit.service';
import type { OutfitPageQuery } from './outfit.service';

@Controller('outfit')
export class OutfitController {
  constructor(private readonly outfitService: OutfitService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.outfitService.findAll(user.sub);
  }

  @Get('page')
  findPage(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OutfitPageQuery,
  ) {
    return this.outfitService.findPage(user.sub, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.outfitService.findOne(Number(id), user.sub);
  }

  @Post()
  create(
    @Body() data: Partial<Outfit>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.outfitService.create(data, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Outfit>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.outfitService.update(Number(id), data, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.outfitService.remove(Number(id), user.sub);
  }
}
