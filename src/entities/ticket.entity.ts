import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Addon } from './addon.entity';
import { Tax } from './tax.entity';

export enum DiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_name: string;

  @Column('int')
  quantity: number;

  @Column('int', { default: 0 })
  sold_count: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int', { default: 1 })
  min_buy: number;

  @Column('int', { default: 20 })
  max_buy: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  sales_start_date: string;

  @Column({ type: 'time' })
  sales_start_time: string;

  @Column({ type: 'date' })
  sales_end_date: string;

  @Column({ type: 'time' })
  sales_end_time: string;

  @Column({ type: 'enum', enum: DiscountType, nullable: true })
  discount_type?: DiscountType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discount_value?: number;

  @Column({ default: false })
  early_bird_enabled: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  early_bird_discount_value?: number;

  @Column({ type: 'timestamp', nullable: true })
  early_bird_start?: Date;

  @Column({ type: 'timestamp', nullable: true })
  early_bird_end?: Date;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE' })
  event: Event;

  @OneToMany(() => Addon, (addon) => addon.ticket, { cascade: true })
  addons: Addon[];

  @ManyToMany(() => Tax, { cascade: true })
  @JoinTable({
    name: 'ticket_taxes',
    joinColumn: { name: 'ticket_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tax_id', referencedColumnName: 'id' },
  })
  taxes: Tax[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
