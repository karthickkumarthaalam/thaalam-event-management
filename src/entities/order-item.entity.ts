import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Generated,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderItemAddon } from './order-item-addon.entity';
import { OrderItemTax } from './order-item-tax.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  USER = 'used',
  CONFIRMED = 'confirmed',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  @Generated('increment')
  ticketId: string;
  //ALTER TABLE order_items AUTO_INCREMENT = 500001;

  @ManyToOne(() => Order, (order) => order.Items, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  ticketRefId: string;

  @Column()
  ticketClass: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  // 👇 NEW COLUMN
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status: TicketStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => OrderItemAddon, (addon) => addon.orderItem, {
    cascade: true,
  })
  addons: OrderItemAddon[];

  @OneToMany(() => OrderItemTax, (tax) => tax.orderItem, { cascade: true })
  taxes: OrderItemTax[];
}
