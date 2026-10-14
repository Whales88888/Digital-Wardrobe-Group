import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('password_reset_tokens')
@Index('idx_password_reset_user_expiry', ['user_id', 'expires_at'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  password_reset_token_id: number;

  @Column()
  user_id: number;

  @Column({ length: 64, unique: true })
  token_hash: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;
}
