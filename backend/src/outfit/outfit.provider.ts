import { DataSource } from 'typeorm';
import { Outfit } from './outfit.entity';

export const outfitProviders = [
  {
    provide: 'OUTFIT_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Outfit),
    inject: ['DATA_SOURCE'],
  },
];