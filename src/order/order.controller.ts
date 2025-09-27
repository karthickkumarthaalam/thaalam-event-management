import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/orderDto';
import { PaymentFactoryService } from 'src/payment/payment-factory.service';
import { MailerService } from 'src/mail/mailer.service';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentFactoryService,
    private readonly mailSerivce: MailerService,
  ) {}

  @Post('checkout-admin')
  async createOrGetPendingOrder(@Body() dto: CreateOrderDto): Promise<{
    message: string;
    frontendCheckoutUrl: string;
  }> {
    const order = await this.orderService.createOrGetPendingOrder(dto);
    if (!order) throw new BadRequestException('Order could not be created');

    const frontendCheckoutUrl = `${process.env.FRONTEND_URL}/checkout/${order.id}`;

    await this.paymentService.createPendingPaymentRecord({
      orderId: order.id,
      gateway: 'stripe',
      paymentMode: undefined,
    });

    await this.mailSerivce.sendPaymentLinkEmail(
      order.event?.name || '',
      dto.purchaseEmail,
      dto.purchaserName,
      order.id,
      frontendCheckoutUrl,
    );

    return {
      message: 'Payment link sent successfully to purchaser email',
      frontendCheckoutUrl,
    };
  }

  @Get('/single-order/:orderId')
  async getOrder(
    @Param('orderId') orderId: string,
    @Query('includeEvent') includeEvent?: string,
  ) {
    const shouldIncludeEvent = includeEvent === 'true';
    return this.orderService.getOrder(orderId, shouldIncludeEvent);
  }

  @Get('/payment-modes')
  getPaymentModes(@Query('country') queryCountry?: string) {
    const country = queryCountry?.toLowerCase() || 'switzerland';
    const countryConfig = this.paymentService.getCountryConfig(country);
    if (!countryConfig) {
      throw new BadRequestException(
        `Invalid country configuration for: ${country}`,
      );
    }

    return { paymentModes: countryConfig.paymentModes };
  }
}
