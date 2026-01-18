import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentType, PaymentMethodType } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { InitiateMobileMoneyDto } from './dto/initiate-mobile-money.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    }
  }

  // ==================== PAYMENT HISTORY ====================

  async findAll(userId: string, query: QueryPaymentsDto) {
    const {
      status,
      type,
      paymentMethod,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.property', 'property')
      .leftJoinAndSelect('payment.booking', 'booking')
      .where('payment.userId = :userId', { userId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('payment.type = :type', { type });
    }

    if (paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    if (search) {
      queryBuilder.andWhere(
        '(property.title ILIKE :search OR payment.description ILIKE :search OR payment.receiptNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    queryBuilder
      .orderBy(`payment.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const payments = await queryBuilder.getMany();

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, userId },
      relations: ['property', 'booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // ==================== PAYMENT CREATION ====================

  async create(userId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const receiptNumber = this.generateReceiptNumber();

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      userId,
      receiptNumber,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(payment);
  }

  // ==================== MOBILE MONEY INTEGRATION ====================

  async initiateMobileMoneyPayment(userId: string, dto: InitiateMobileMoneyDto): Promise<Payment> {
    // Normalize phone number to Ugandan format
    let phoneNumber = dto.phoneNumber.replace(/\s/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '256' + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('256')) {
      phoneNumber = '256' + phoneNumber;
    }

    const receiptNumber = this.generateReceiptNumber();
    const transactionRef = this.generateTransactionRef(dto.provider);

    // Create payment record
    const payment = this.paymentRepository.create({
      userId,
      propertyId: dto.propertyId,
      bookingId: dto.bookingId,
      type: dto.type,
      paymentMethod: dto.provider,
      amount: dto.amount,
      currency: dto.currency || 'UGX',
      phoneNumber,
      description: dto.description,
      receiptNumber,
      transactionRef,
      status: PaymentStatus.PROCESSING,
      metadata: {
        provider: dto.provider,
        initiatedAt: new Date().toISOString(),
      },
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // In a real implementation, you would call the MTN/Airtel API here
    // For now, we'll simulate the payment initiation
    console.log(`[PAYMENTS] Initiating ${dto.provider} payment:`, {
      transactionRef,
      phoneNumber,
      amount: dto.amount,
      currency: dto.currency,
    });

    // Simulate API call to mobile money provider
    // In production, integrate with:
    // - MTN MoMo API: https://momodeveloper.mtn.com/
    // - Airtel Money API: https://developers.airtel.africa/
    
    // For demo purposes, we'll auto-complete after a delay
    // In production, you'd use webhooks to update the status
    setTimeout(async () => {
      await this.updatePaymentStatus(savedPayment.id, PaymentStatus.COMPLETED);
    }, 5000);

    return savedPayment;
  }

  async verifyMobileMoneyPayment(transactionRef: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionRef },
      relations: ['property', 'booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // In production, you would verify with the mobile money provider API
    // For now, return the current status
    return payment;
  }

  // ==================== STRIPE INTEGRATION ====================

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  async createCheckoutSession(items: any[], successUrl: string, cancelUrl: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session;
  }

  // ==================== PAYMENT METHODS ====================

  async findPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    // Mask sensitive data
    let maskedPhone = dto.phoneNumber;
    if (dto.phoneNumber) {
      maskedPhone = dto.phoneNumber.slice(0, 3) + '****' + dto.phoneNumber.slice(-3);
    }

    const paymentMethod = this.paymentMethodRepository.create({
      ...dto,
      userId,
      phoneNumber: dto.phoneNumber, // Store full number
      metadata: {
        maskedPhone, // Store masked version for display
      },
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async updatePaymentMethod(
    id: string,
    userId: string,
    dto: Partial<CreatePaymentMethodDto>,
  ): Promise<PaymentMethod> {
    const method = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.paymentMethodRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(method, dto);
    return this.paymentMethodRepository.save(method);
  }

  async deletePaymentMethod(id: string, userId: string): Promise<void> {
    const method = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    await this.paymentMethodRepository.remove(method);
  }

  async setDefaultPaymentMethod(id: string, userId: string): Promise<PaymentMethod> {
    const method = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset all other defaults
    await this.paymentMethodRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Set this one as default
    method.isDefault = true;
    return this.paymentMethodRepository.save(method);
  }

  // ==================== STATISTICS ====================

  async getPaymentStats(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get payments for the period
    const payments = await this.paymentRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, now),
      },
    });

    // Calculate stats
    const totalSpent = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = payments
      .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const completedCount = payments.filter(p => p.status === PaymentStatus.COMPLETED).length;
    const pendingCount = payments.filter(p => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING
    ).length;
    const failedCount = payments.filter(p => p.status === PaymentStatus.FAILED).length;

    // Breakdown by type
    const byType: Record<string, { count: number; total: number }> = {};
    payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .forEach(p => {
        if (!byType[p.type]) {
          byType[p.type] = { count: 0, total: 0 };
        }
        byType[p.type].count++;
        byType[p.type].total += Number(p.amount);
      });

    // Breakdown by payment method
    const byMethod: Record<string, { count: number; total: number }> = {};
    payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .forEach(p => {
        if (!byMethod[p.paymentMethod]) {
          byMethod[p.paymentMethod] = { count: 0, total: 0 };
        }
        byMethod[p.paymentMethod].count++;
        byMethod[p.paymentMethod].total += Number(p.amount);
      });

    // Monthly trend (last 6 months)
    const monthlyTrend = await this.getMonthlyTrend(userId);

    return {
      period,
      totalSpent,
      pendingAmount,
      completedCount,
      pendingCount,
      failedCount,
      byType,
      byMethod,
      monthlyTrend,
    };
  }

  private async getMonthlyTrend(userId: string) {
    const months: { month: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const payments = await this.paymentRepository.find({
        where: {
          userId,
          status: PaymentStatus.COMPLETED,
          createdAt: Between(monthStart, monthEnd),
        },
      });

      const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      months.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        total,
      });
    }

    return months;
  }

  // ==================== RECEIPTS ====================

  async generateReceipt(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
      relations: ['property', 'booking', 'user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // In production, you would generate a PDF receipt here
    // For now, return receipt data
    return {
      receiptNumber: payment.receiptNumber,
      date: payment.completedAt || payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      type: payment.type,
      paymentMethod: payment.paymentMethod,
      property: payment.property ? {
        id: payment.property.id,
        title: payment.property.title,
      } : null,
      description: payment.description,
      transactionRef: payment.transactionRef,
    };
  }

  // ==================== HELPER METHODS ====================

  private generateReceiptNumber(): string {
    const prefix = 'PMO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateTransactionRef(provider: PaymentMethodType): string {
    const prefix = provider === PaymentMethodType.MTN_MOMO ? 'MTN' : 'AIR';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    await this.paymentRepository.update(paymentId, {
      status,
      completedAt: status === PaymentStatus.COMPLETED ? new Date() : undefined,
    });
  }

  // ==================== REFUNDS ====================

  async initiateRefund(
    paymentId: string,
    userId: string,
    reason: string,
    amount?: number,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId, status: PaymentStatus.COMPLETED },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or not eligible for refund');
    }

    const refundAmount = amount || Number(payment.amount);

    if (refundAmount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // Update payment record
    payment.refundedAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.status = refundAmount === Number(payment.amount) 
      ? PaymentStatus.REFUNDED 
      : PaymentStatus.COMPLETED; // Partial refund

    // In production, initiate refund with payment provider
    console.log(`[PAYMENTS] Initiating refund:`, {
      paymentId,
      refundAmount,
      reason,
    });

    return this.paymentRepository.save(payment);
  }
}
