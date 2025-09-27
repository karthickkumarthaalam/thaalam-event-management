import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentFactoryService } from './payment-factory.service';
import { StripePaymentService } from './stripePayment.service';
import { Refund } from 'src/entities/refund.entity';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly stripeService: StripePaymentService,
    private readonly paymentFactory: PaymentFactoryService,
  ) {}

  @Post('refund/:paymentId')
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; reason: string },
  ): Promise<Refund> {
    const { amount, reason } = body;

    return this.stripeService.refundPayment(paymentId, amount, reason);
  }

  @Post('checkout-session')
  async createCheckoutSession(
    @Body()
    body: {
      gateway: 'stripe';
      orderId: string;
      country: string;
      paymentMode: string;
    },
  ) {
    return this.paymentFactory.createCheckoutsession(
      body.gateway,
      body.orderId,
      body.country,
      body.paymentMode,
    );
  }
}
