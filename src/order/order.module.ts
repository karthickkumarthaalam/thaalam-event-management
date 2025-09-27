import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { OrderItemTax } from 'src/entities/order-item-tax.entity';
import { OrderItemAddon } from 'src/entities/order-item-addon.entity';
import { PromoCode } from 'src/entities/promoCode.entity';
import { TicketModule } from 'src/ticket/tickets.module';
import { PaymentModule } from 'src/payment/payment.module';
import { MailerService } from 'src/mail/mailer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderItemTax,
      OrderItemAddon,
      PromoCode,
    ]),
    TicketModule,
    PaymentModule,
  ],
  providers: [OrderService, MailerService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
