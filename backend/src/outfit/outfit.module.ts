import { Module } from '@nestjs/common';
import { OutfitController } from './outfit.controller';
import { OutfitService } from './outfit.service';
import { outfitProviders } from './outfit.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OutfitController],
  providers: [
    OutfitService,
    ...outfitProviders,
  ],
})
export class OutfitModule {}