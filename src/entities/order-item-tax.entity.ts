import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('order_item_taxes')
export class OrderItemTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.taxes, {
    onDelete: 'CASCADE',
  })
  orderItem: OrderItem;

  @Column()
  taxRefId: string;

  @Column()
  taxName: string;

  @Column('decimal', { precision: 5, scale: 2 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
