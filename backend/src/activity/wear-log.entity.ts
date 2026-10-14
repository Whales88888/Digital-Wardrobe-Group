import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wear_logs')
export class WearLog {
  @PrimaryGeneratedColumn()
  wear_log_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  worn_on: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  outfit_id: number | null;
}
