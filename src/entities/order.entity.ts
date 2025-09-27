import {
  Column,
  CreateDateColumn,
  Generated,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Event } from './event.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  @Generated('increment')
  orderId: number;
  //ALTER TABLE orders AUTO_INCREMENT = 1000001;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ length: 100 })
  purchaserName: string;

  @Column()
  purchaseEmail: string;

  @Column({ length: 30 })
  purchaseMobile: string;

  @Column({ type: 'text', nullable: true })
  purchaseBillingAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountCollected?: number;

  @Column({ length: 50, nullable: true })
  promoCode: string;

  @Column({ length: 50, nullable: true })
  affiliateCode: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discountedAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ length: 30, nullable: true })
  paymentMode: string;

  @Column({ length: 30, nullable: true })
  paymentGateway: string;

  @Column({ length: 100, nullable: true })
  gatewayTransactionId: string;

  @CreateDateColumn()
  purchasedOn: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  orderTime: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  Items: OrderItem[];
}
