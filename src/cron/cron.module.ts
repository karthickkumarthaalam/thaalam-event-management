import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/entities/payment.entity';
import { PaymentCronService } from './payment.cron.service';
import { Order } from 'src/entities/order.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { OrderItem } from 'src/entities/order-item.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Payment, Order, Ticket, OrderItem]),
  ],
  providers: [PaymentCronService],
  exports: [PaymentCronService],
})
export class CronModule {}
