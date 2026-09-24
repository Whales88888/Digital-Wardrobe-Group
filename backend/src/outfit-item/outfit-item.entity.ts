import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('outfit_items')
export class OutfitItem {
  @PrimaryGeneratedColumn()
  outfit_item_id: number;

  @Column()
  outfit_id: number;

  @Column()
  clothing_id: number;
}