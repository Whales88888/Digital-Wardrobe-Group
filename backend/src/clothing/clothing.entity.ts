import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export const CLOTHING_SEASONS = [
  'spring',
  'summer',
  'autumn',
  'winter',
  'all-season',
] as const;
export const CLOTHING_TYPES = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'shoes',
  'accessory',
] as const;

export type ClothingSeason = (typeof CLOTHING_SEASONS)[number];
export type ClothingType = (typeof CLOTHING_TYPES)[number];

@Entity('clothing')
export class Clothing {
  @PrimaryGeneratedColumn()
  clothing_id: number;

  @Column()
  user_id: number;

  @Column()
  category_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ length: 20, nullable: true })
  size: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  season: ClothingSeason | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  clothing_type: ClothingType | null;

  @Column({ type: 'text', nullable: true })
  care_instructions: string | null;

  @Column({ type: 'date', nullable: true })
  last_washed_at: string | null;

  @Column({ type: 'int', default: 3 })
  wash_after_wears: number;
}
