import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ClothingService } from './clothing.service';
import { Clothing } from './clothing.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ImageStorageService } from './image-storage.service';
import type { ImageUploadFile } from './image-storage.service';
import type { ClothingFilters } from './clothing.service';

@Controller('clothing')
export class ClothingController {
  constructor(
    private readonly clothingService: ClothingService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  @Get('images/:userId/:fileName')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getLocalImage(
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    if (!/^[1-9]\d*$/.test(userId) || Number(userId) !== user.sub) {
      throw new NotFoundException('Image not found');
    }
    const image = await this.imageStorage.readLocal(user.sub, fileName);
    return new StreamableFile(image.buffer, { type: image.mimetype });
  }

  @Get('images/:userId')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getCloudinaryImage(
    @Param('userId') userId: string,
    @Query('asset') publicId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    if (!/^[1-9]\d*$/.test(userId) || Number(userId) !== user.sub) {
      throw new NotFoundException('Image not found');
    }
    const image = await this.imageStorage.readCloudinary(user.sub, publicId);
    return new StreamableFile(image.buffer, { type: image.mimetype });
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ClothingFilters,
  ) {
    return this.clothingService.findAll(user.sub, filters);
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

  @Post('images')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile() file: ImageUploadFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ image_url: string }> {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    return { image_url: await this.imageStorage.upload(file, user.sub) };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Clothing>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Clothing | null> {
    return this.updateClothing(Number(id), data, user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.removeClothing(Number(id), user.sub);
  }

  private async updateClothing(
    clothingId: number,
    data: Partial<Clothing>,
    userId: number,
  ): Promise<Clothing | null> {
    const existing = await this.clothingService.findOne(clothingId, userId);
    const updated = await this.clothingService.update(clothingId, data, userId);
    if (
      existing?.image_url &&
      data.image_url !== undefined &&
      data.image_url !== existing.image_url
    ) {
      await this.imageStorage.delete(existing.image_url, userId);
    }
    return updated;
  }

  private async removeClothing(clothingId: number, userId: number): Promise<void> {
    const existing = await this.clothingService.findOne(clothingId, userId);
    await this.clothingService.remove(clothingId, userId);
    await this.imageStorage.delete(existing?.image_url, userId);
  }
}
