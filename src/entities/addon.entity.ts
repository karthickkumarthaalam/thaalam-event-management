import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

export enum AddonType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity()
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  addon_name: string;

  @Column({ type: 'enum', enum: AddonType })
  addon_type: AddonType;

  @Column('decimal', { precision: 10, scale: 2 })
  addon_value: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.addons, { onDelete: 'CASCADE' })
  ticket: Ticket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
