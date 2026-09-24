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

@Controller('clothing')
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @Get()
  findAll(): Promise<Clothing[]> {
    return this.clothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Clothing | null> {
    return this.clothingService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: Partial<Clothing>): Promise<Clothing> {
    return this.clothingService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Clothing>,
  ): Promise<Clothing | null> {
    return this.clothingService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.clothingService.remove(Number(id));
  }
}