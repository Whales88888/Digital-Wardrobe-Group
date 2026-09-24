import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}