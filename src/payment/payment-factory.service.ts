import { BadRequestException, Injectable } from '@nestjs/common';
import { StripePaymentService } from './stripePayment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from 'src/entities/payment.entity';
import { Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';

@Injectable()
export class PaymentFactoryService {
  constructor(
    private readonly stripeService: StripePaymentService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async createCheckoutsession(
    gateway: 'stripe' | 'razorpay' | 'paypal',
    orderId: string,
    country: string,
    paymentMode: string,
  ) {
    switch (gateway) {
      case 'stripe':
        return this.stripeService.createCheckoutSession(
          orderId,
          country,
          paymentMode,
        );
      default:
        throw new BadRequestException(
          `Payment gateway ${gateway} not supported`,
        );
    }
  }

  getCountryConfig(country: string) {
    const config = this.stripeService.countryPaymentMap[country.toLowerCase()];
    if (!config)
      throw new BadRequestException(`Payments not supported in ${country}`);
    return config;
  }

  async createPendingPaymentRecord({
    orderId,
    gateway,
    paymentMode,
  }: {
    orderId: string;
    gateway: 'stripe';
    paymentMode?: string;
  }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Order not found');

    const payment = this.paymentRepo.create({
      order,
      paymentType: 'checkout',
      paymentMode,
      amount: order.totalAmount,
      paymentGateway: gateway,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    await this.paymentRepo.save(payment);
    return payment;
  }
}
