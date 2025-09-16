import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

export enum TaxType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum TaxMode {
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
}

export enum TaxApplicableOn {
  Ticket = 'ticket',
  ADDON = 'addon',
  BOTH = 'both',
}

@Entity()
export class Tax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TaxMode })
  mode: TaxMode;

  @Column({ type: 'enum', enum: TaxType })
  type: TaxType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: TaxApplicableOn,
    default: TaxApplicableOn.Ticket,
  })
  applicable_on: TaxApplicableOn;

  @Column({ default: true })
  status: boolean;

  @Column()
  user_id: string;

  @Column()
  event_id: string;

  @ManyToMany(() => Ticket, (ticket) => ticket.taxes)
  tickets: Ticket[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
