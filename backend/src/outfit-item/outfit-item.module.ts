import { Module } from '@nestjs/common';
import { OutfitItemController } from './outfit-item.controller';
import { OutfitItemService } from './outfit-item.service';
import { outfitItemProviders } from './outfit-item.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OutfitItemController],
  providers: [
    OutfitItemService,
    ...outfitItemProviders,
  ],
})
export class OutfitItemModule {}