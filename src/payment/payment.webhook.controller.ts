import { Controller, Post, Req, Res } from '@nestjs/common';
import { StripePaymentService } from './stripePayment.service';
import type { Request, Response } from 'express';

@Controller('payments')
export class PaymentWebhookController {
  constructor(private readonly stripeService: StripePaymentService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    await this.stripeService.handleWebhook(req, res);
  }
}
