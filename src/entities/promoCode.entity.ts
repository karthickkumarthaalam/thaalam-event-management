import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Event } from './event.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('promo_code')
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.FIXED,
  })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'timestamp', nullable: true })
  validFrom?: Date;

  @Column({ type: 'timestamp', nullable: true })
  validTo?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  // --- Relation to Event ---
  @ManyToOne(() => Event, (event) => event.promoCodes, { onDelete: 'CASCADE' })
  event: Event;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
