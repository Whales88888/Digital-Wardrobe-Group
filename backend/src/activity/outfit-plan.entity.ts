import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('outfit_plans')
export class OutfitPlan {
  @PrimaryGeneratedColumn()
  outfit_plan_id: number;

  @Column()
  user_id: number;

  @Column()
  outfit_id: number;

  @Column({ type: 'date' })
  planned_for: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  occasion: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
