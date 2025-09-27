import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from 'src/entities/order-item.entity';
import { PaymentStatus as OrderpaymentStatus } from 'src/entities/order.entity';
import { Payment, PaymentStatus } from 'src/entities/payment.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class PaymentCronService {
  private readonly logger = new Logger(PaymentCronService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingPayments() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const oldPendingPayments = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: LessThan(thirtyMinutesAgo),
      },
      relations: ['order', 'order.Items'],
    });

    if (oldPendingPayments.length === 0) {
      return;
    }

    for (const payment of oldPendingPayments) {
      payment.status = PaymentStatus.CANCELLED;
      if (payment.order) {
        payment.order.paymentStatus = OrderpaymentStatus.CANCELLED;
      }

      if (payment.order?.Items?.length) {
        for (const item of payment.order.Items) {
          const ticket = await this.ticketRepo.findOne({
            where: {
              id: item.ticketRefId,
            },
          });
          if (ticket) {
            ticket.sold_count -= item.quantity;
            await this.ticketRepo.save(ticket);
          }
        }
      }

      await this.paymentRepo.save(payment);
      if (payment.order) {
        await this.paymentRepo.manager.save(payment.order);
      }

      this.logger.warn(
        `Cancelled pending payment ID ${payment.id} for order ID ${payment.order?.id}`,
      );
    }
  }
}
