import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';

import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ClothingModule } from './clothing/clothing.module';
import { OutfitModule } from './outfit/outfit.module';
import { OutfitItemModule } from './outfit-item/outfit-item.module';

@Module({
  imports: [
    DatabaseModule,

    UserModule,
    CategoryModule,
    ClothingModule,
    OutfitModule,
    OutfitItemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}