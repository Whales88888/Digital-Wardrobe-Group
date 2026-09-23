import { Module } from '@nestjs/common';
import { ClothingController } from './clothing.controller';
import { ClothingService } from './clothing.service';

@Module({
  controllers: [ClothingController],
  providers: [ClothingService]
})
export class ClothingModule {}
