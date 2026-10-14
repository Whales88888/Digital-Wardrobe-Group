import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wear_log_items')
export class WearLogItem {
  @PrimaryGeneratedColumn()
  wear_log_item_id: number;

  @Column()
  wear_log_id: number;

  @Column()
  clothing_id: number;
}
