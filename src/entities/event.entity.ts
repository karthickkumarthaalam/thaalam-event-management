import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';
import { PromoCode } from './promoCode.entity';

export enum EventStatus {
  PLANING = 'planing',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  slug?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  currency_symbol: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string | null;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PLANING })
  status: EventStatus;

  @OneToMany(() => Ticket, (ticket) => ticket.event, { cascade: true })
  tickets: Ticket[];

  @OneToMany(() => PromoCode, (promo) => promo.event)
  promoCodes: PromoCode[];

  @ManyToOne(() => User, (user) => user.events, { eager: true })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
