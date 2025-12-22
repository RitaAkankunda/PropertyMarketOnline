import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'));
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  async createCheckoutSession(items: any[], successUrl: string, cancelUrl: string) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session;
  }
}