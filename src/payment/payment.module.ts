import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/entities/payment.entity';
import { StripePaymentService } from './stripePayment.service';
import { Order } from 'src/entities/order.entity';
import { PaymentFactoryService } from './payment-factory.service';
import Stripe from 'stripe';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { Refund } from 'src/entities/refund.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { Event } from 'src/entities/event.entity';
import { RedisService } from 'src/redis/redis.service';
import { TicketQueueService } from 'src/ticket-queue/ticket-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Order,
      Refund,
      OrderItem,
      Ticket,
      Event,
    ]),
  ],
  providers: [
    StripePaymentService,
    PaymentFactoryService,
    RedisService,
    TicketQueueService,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: () => {
        return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2025-08-27.basil',
        });
      },
    },
  ],
  controllers: [PaymentController, PaymentWebhookController],
  exports: [PaymentFactoryService],
})
export class PaymentModule {}
