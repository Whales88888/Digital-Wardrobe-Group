import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { OutfitItem } from './outfit-item.entity';
import { OutfitItemService } from './outfit-item.service';

@Controller('outfit-item')
export class OutfitItemController {
  constructor(private readonly outfitItemService: OutfitItemService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.outfitItemService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.outfitItemService.findOne(Number(id), user.sub);
  }

  @Post()
  create(
    @Body() data: Partial<OutfitItem>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.outfitItemService.create(data, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<OutfitItem>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.outfitItemService.update(Number(id), data, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.outfitItemService.remove(Number(id), user.sub);
  }
}
