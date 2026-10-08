import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ClothingService } from './clothing.service';
import { Clothing } from './clothing.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('clothing')
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Clothing[]> {
    return this.clothingService.findAll(user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Clothing | null> {
    return this.clothingService.findOne(Number(id), user.sub);
  }

  @Post()
  create(
    @Body() data: Partial<Clothing>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Clothing> {
    return this.clothingService.create(data, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Clothing>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Clothing | null> {
    return this.clothingService.update(Number(id), data, user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.clothingService.remove(Number(id), user.sub);
  }
}
