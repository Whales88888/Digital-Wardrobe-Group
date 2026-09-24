import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { OutfitItemService } from './outfit-item.service';
import { OutfitItem } from './outfit-item.entity';

@Controller('outfit-item')
export class OutfitItemController {
  constructor(
    private readonly outfitItemService: OutfitItemService,
  ) {}

  @Get()
  findAll(): Promise<OutfitItem[]> {
    return this.outfitItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OutfitItem> {
    return this.outfitItemService.findOne(Number(id));
  }

  @Post()
  create(
    @Body() data: Partial<OutfitItem>,
  ): Promise<OutfitItem> {
    return this.outfitItemService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<OutfitItem>,
  ): Promise<OutfitItem> {
    return this.outfitItemService.update(
      Number(id),
      data,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.outfitItemService.remove(Number(id));
  }
}