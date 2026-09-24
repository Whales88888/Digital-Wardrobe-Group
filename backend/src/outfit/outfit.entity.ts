import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('outfits')
export class Outfit {
  @PrimaryGeneratedColumn()
  outfit_id: number;

  @Column()
  user_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}