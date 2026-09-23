import { Module } from '@nestjs/common';
import { OutfitItemController } from './outfit-item.controller';
import { OutfitItemService } from './outfit-item.service';

@Module({
  controllers: [OutfitItemController],
  providers: [OutfitItemService]
})
export class OutfitItemModule {}
