import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string }) {
    return this.paymentsService.createPaymentIntent(body.amount, body.currency);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-session')
  async createCheckoutSession(@Body() body: { items: any[]; successUrl: string; cancelUrl: string }) {
    return this.paymentsService.createCheckoutSession(body.items, body.successUrl, body.cancelUrl);
  }
}