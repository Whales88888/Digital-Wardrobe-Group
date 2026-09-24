import { DataSource } from 'typeorm';
import { Clothing } from './clothing.entity';

export const clothingProviders = [
  {
    provide: 'CLOTHING_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Clothing),
    inject: ['DATA_SOURCE'],
  },
];