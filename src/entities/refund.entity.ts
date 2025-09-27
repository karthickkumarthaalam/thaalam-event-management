import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';

export enum RefundStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => OrderItem, { nullable: true, onDelete: 'CASCADE' })
  ticket: OrderItem | null;

  @Column('decimal', { precision: 10, scale: 2 })
  refundAmount: number;

  @Column()
  refundMode: string;

  @Column()
  refundGateway: string;

  @Column({ nullable: true })
  refundTransactionId: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  refundStatus: RefundStatus;

  @Column()
  reason: string;

  @CreateDateColumn()
  requestedOn: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedOn: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
