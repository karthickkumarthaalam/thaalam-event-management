import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { Repository, DataSource } from 'typeorm';
import { TicketStatus } from 'src/entities/order-item.entity';
import {
  Order,
  PaymentStatus as OrderPaymentStatus,
} from 'src/entities/order.entity';
import { Payment, PaymentStatus } from 'src/entities/payment.entity';
import { PromoCode } from 'src/entities/promoCode.entity';
import { Refund, RefundStatus } from 'src/entities/refund.entity';
import { Ticket } from 'src/entities/ticket.entity';
import Stripe from 'stripe';
import { RedisService } from 'src/redis/redis.service';
import { TicketQueueService } from 'src/ticket-queue/ticket-queue.service';

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);

  countryPaymentMap = {
    india: {
      currency: 'inr',
      paymentModes: ['card'],
    },
    switzerland: { currency: 'chf', paymentModes: ['card', 'twint'] },
    germany: { currency: 'eur', paymentModes: ['card', 'sepa_debit'] },
    france: { currency: 'eur', paymentModes: ['card', 'sepa_debit'] },
    'sri lanka': {
      currency: 'lkr',
      paymentModes: ['card', 'ezcash', 'mobitel'],
    },
  };

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly ticketQueueService: TicketQueueService,
  ) {}

  // -----------------------------
  // CREATE CHECKOUT SESSION
  // -----------------------------
  async createCheckoutSession(orderId, country, paymentMode) {
    // 1️⃣ Fetch order including addons & taxes
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');

    const countryConfig = this.countryPaymentMap[country.toLowerCase()];

    if (!countryConfig)
      throw new BadRequestException('Country details not found');

    const totalAmount = order.totalAmount;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: [paymentMode || 'card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: countryConfig.currency || 'usd',
            product_data: {
              name: `Order #${order.orderId} - ${order.event?.name || 'Tickets'}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
      },
      success_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}`,
    });

    await this.paymentRepo.update(
      { order: { id: orderId } },
      { paymentSessionId: session.id },
    );

    return { sessionId: session.id };
  }

  // -----------------------------
  // HANDLE STRIPE WEBHOOK
  // -----------------------------
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleSuccessfulPayment(event.data.object as any);
          break;
        case 'charge.refunded':
          await this.handleStripeRefund(event.data.object as any);
          break;
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data.object as any);
          break;
        default:
          this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }
      res.status(200).send({ received: true });
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  // -----------------------------
  // SUCCESSFUL PAYMENT
  // -----------------------------
  async handleSuccessfulPayment(session: any) {
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { paymentSessionId: session.id },
        relations: ['order', 'order.Items'],
      });
      if (!payment) return;

      payment.gatewayTransactionId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      payment.status = PaymentStatus.PAID;
      await manager.save(payment);

      const order = payment.order;
      order.paymentStatus = OrderPaymentStatus.PAID;
      await manager.save(order);

      const client = this.redisService.getClient();

      for (const item of order.Items) {
        const ticket = await manager.findOne(Ticket, {
          where: { id: item.ticketRefId },
        });
        if (ticket) {
          ticket.sold_count += item.quantity;
          await manager.save(ticket);

          await client.del(`reservation:${order.id}:${ticket.id}`);

          await this.ticketQueueService.addJob({
            orderId: order.id,
            ticketId: ticket.id,
            quantity: item.quantity,
            userEmail: order.purchaseEmail,
          });
        }
        item.status = TicketStatus.CONFIRMED;
        await manager.save(item);
      }

      // Increment promo used count if applicable
      if (order.promoCode) {
        const promoRepo = manager.getRepository(PromoCode);
        const promo = await promoRepo.findOne({
          where: { code: order.promoCode },
        });
        if (promo) {
          promo.usedCount += 1;
          await promoRepo.save(promo);
        }
      }
    });
  }

  // -----------------------------
  // FAILED PAYMENT
  // -----------------------------
  async handleFailedPayment(session: any) {
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { paymentSessionId: session.id },
        relations: ['order', 'order.Items'],
      });
      if (!payment) return;

      payment.status = PaymentStatus.FAILED;
      await manager.save(payment);

      const order = payment.order;
      order.paymentStatus = OrderPaymentStatus.CANCELLED;
      await manager.save(order);

      // Release Redis reservations
      const client = this.redisService.getClient();
      for (const item of order.Items) {
        await client.incrby(
          `remainingTickets:${item.ticketRefId}`,
          item.quantity,
        );
        await client.del(`reservation:${order.id}:${item.ticketRefId}`);
        item.status = TicketStatus.CANCELLED;
        await manager.save(item);
      }
    });
  }

  // -----------------------------
  // STRIPE REFUND WEBHOOK
  // -----------------------------
  async handleStripeRefund(refundObj: any) {
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { gatewayTransactionId: refundObj.payment_intent },
        relations: ['order', 'order.Items'],
      });
      if (!payment) return;

      payment.status = PaymentStatus.REFUNDED;
      await manager.save(payment);

      const order = payment.order;
      order.paymentStatus = OrderPaymentStatus.REFUNDED;
      await manager.save(order);

      if (order.Items?.length) {
        for (const item of order.Items) {
          item.status = TicketStatus.REFUNDED;
          await manager.save(item);

          const ticket = await manager.findOne(Ticket, {
            where: { id: item.ticketRefId },
          });
          if (ticket) {
            ticket.sold_count -= item.quantity;
            await manager.save(ticket);
          }
        }
      }
    });
  }

  // -----------------------------
  // MANUAL REFUND
  // -----------------------------
  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<Refund> {
    return await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
        relations: ['order', 'order.Items'],
      });
      if (!payment) throw new BadRequestException('Payment not found');
      if (payment.status !== PaymentStatus.PAID)
        throw new BadRequestException('Payment is not completed');

      const refund = manager.create(Refund, {
        order: payment.order,
        refundAmount: amount,
        refundGateway: 'stripe',
        refundMode: 'original',
        refundStatus: RefundStatus.PENDING,
        reason,
      });
      await manager.save(refund);

      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.gatewayTransactionId,
        amount: Math.round(amount * 100),
      });

      refund.refundTransactionId = stripeRefund.id;
      refund.refundStatus = RefundStatus.SUCCESS;
      refund.processedOn = new Date();
      await manager.save(refund);

      payment.status = PaymentStatus.REFUNDED;
      await manager.save(payment);

      const order = payment.order;
      order.paymentStatus = OrderPaymentStatus.REFUNDED;
      await manager.save(order);

      if (order.Items?.length) {
        for (const item of order.Items) {
          item.status = TicketStatus.REFUNDED;
          await manager.save(item);

          const ticket = await manager.findOne(Ticket, {
            where: { id: item.ticketRefId },
          });
          if (ticket) {
            ticket.sold_count -= item.quantity;
            await manager.save(ticket);
          }
        }
      }

      return refund;
    });
  }
}
