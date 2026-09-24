import { Module } from '@nestjs/common';
import { ClothingController } from './clothing.controller';
import { ClothingService } from './clothing.service';
import { clothingProviders } from './clothing.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ClothingController],
  providers: [
    ClothingService,
    ...clothingProviders,
  ],
})
export class ClothingModule {}