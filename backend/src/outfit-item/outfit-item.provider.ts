import { DataSource } from 'typeorm';
import { OutfitItem } from './outfit-item.entity';

export const outfitItemProviders = [
  {
    provide: 'OUTFIT_ITEM_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(OutfitItem),
    inject: ['DATA_SOURCE'],
  },
];