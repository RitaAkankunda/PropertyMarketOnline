import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { InitiateMobileMoneyDto } from './dto/initiate-mobile-money.dto';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==================== PAYMENT HISTORY ====================

  @Get()
  async findAll(@Request() req, @Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(req.user.id, query);
  }

  @Get('stats')
  async getStats(
    @Request() req,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.paymentsService.getPaymentStats(req.user.id, period);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.id);
  }

  @Get(':id/receipt')
  async getReceipt(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.paymentsService.generateReceipt(id, req.user.id);
  }

  // ==================== CREATE PAYMENT ====================

  @Post()
  async create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.id, createPaymentDto);
  }

  // ==================== MOBILE MONEY ====================

  @Post('mobile-money/initiate')
  async initiateMobileMoney(
    @Request() req,
    @Body() dto: InitiateMobileMoneyDto,
  ) {
    return this.paymentsService.initiateMobileMoneyPayment(req.user.id, dto);
  }

  @Get('mobile-money/verify/:transactionRef')
  async verifyMobileMoney(@Param('transactionRef') transactionRef: string) {
    return this.paymentsService.verifyMobileMoneyPayment(transactionRef);
  }

  // ==================== STRIPE ====================

  @Post('stripe/create-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string }) {
    return this.paymentsService.createPaymentIntent(body.amount, body.currency);
  }

  @Post('stripe/create-session')
  async createCheckoutSession(
    @Body() body: { items: any[]; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createCheckoutSession(
      body.items,
      body.successUrl,
      body.cancelUrl,
    );
  }

  // ==================== PAYMENT METHODS ====================

  @Get('methods/list')
  async getPaymentMethods(@Request() req) {
    return this.paymentsService.findPaymentMethods(req.user.id);
  }

  @Post('methods')
  async createPaymentMethod(
    @Request() req,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.paymentsService.createPaymentMethod(req.user.id, dto);
  }

  @Put('methods/:id')
  async updatePaymentMethod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() dto: Partial<CreatePaymentMethodDto>,
  ) {
    return this.paymentsService.updatePaymentMethod(id, req.user.id, dto);
  }

  @Delete('methods/:id')
  async deletePaymentMethod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    await this.paymentsService.deletePaymentMethod(id, req.user.id);
    return { message: 'Payment method deleted successfully' };
  }

  @Put('methods/:id/default')
  async setDefaultPaymentMethod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.paymentsService.setDefaultPaymentMethod(id, req.user.id);
  }

  // ==================== REFUNDS ====================

  @Post(':id/refund')
  async initiateRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() body: { reason: string; amount?: number },
  ) {
    return this.paymentsService.initiateRefund(
      id,
      req.user.id,
      body.reason,
      body.amount,
    );
  }
}
