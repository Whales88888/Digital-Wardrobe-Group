import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { Clothing } from '../clothing/clothing.entity';
import { Outfit } from '../outfit/outfit.entity';
import { OutfitItem } from '../outfit-item/outfit-item.entity';
import { Session } from '../auth/session.entity';
import { WearLog } from '../activity/wear-log.entity';
import { WearLogItem } from '../activity/wear-log-item.entity';
import { OutfitPlan } from '../activity/outfit-plan.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [
          User,
          Category,
          Clothing,
          Outfit,
          OutfitItem,
          Session,
          WearLog,
          WearLogItem,
          OutfitPlan,
        ],
        synchronize: false,
      });

      return dataSource.initialize();
    },
  },
];