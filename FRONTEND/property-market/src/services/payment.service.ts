import api from './api';

// Types
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  BOOKING = 'booking',
  RENT = 'rent',
  DEPOSIT = 'deposit',
  VIEWING = 'viewing',
  SERVICE_FEE = 'service_fee',
  COMMISSION = 'commission',
  REFUND = 'refund',
}

export enum PaymentMethodType {
  MTN_MOMO = 'mtn_momo',
  AIRTEL_MONEY = 'airtel_money',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export interface Payment {
  id: string;
  userId?: string;
  propertyId?: string;
  bookingId?: string;
  property?: {
    id: string;
    title: string;
    images?: any[];
  };
  booking?: any;
  type: PaymentType;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  amount: number;
  currency: string;
  transactionRef?: string;
  externalRef?: string;
  phoneNumber?: string;
  description?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
  receiptNumber?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  name: string;
  phoneNumber?: string;
  last4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  period: 'week' | 'month' | 'year';
  totalSpent: number;
  pendingAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  byType: Record<string, { count: number; total: number }>;
  byMethod: Record<string, { count: number; total: number }>;
  monthlyTrend: { month: string; total: number }[];
}

export interface PaymentReceipt {
  receiptNumber: string;
  date: Date;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  paymentMethod: PaymentMethodType;
  property?: {
    id: string;
    title: string;
  };
  description?: string;
  transactionRef?: string;
}

export interface QueryPaymentsParams {
  status?: PaymentStatus;
  type?: PaymentType;
  paymentMethod?: PaymentMethodType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InitiateMobileMoneyParams {
  provider: PaymentMethodType.MTN_MOMO | PaymentMethodType.AIRTEL_MONEY;
  phoneNumber: string;
  amount: number;
  currency?: string;
  type: PaymentType;
  propertyId?: string;
  bookingId?: string;
  description?: string;
}

export interface CreatePaymentMethodParams {
  type: PaymentMethodType;
  name: string;
  phoneNumber?: string;
  last4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export const paymentService = {
  // ==================== PAYMENT HISTORY ====================

  async getPayments(params?: QueryPaymentsParams): Promise<PaymentsResponse> {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async getPaymentById(id: string): Promise<Payment> {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  async getPaymentReceipt(id: string): Promise<PaymentReceipt> {
    const response = await api.get(`/payments/${id}/receipt`);
    return response.data;
  },

  // Legacy method for backward compatibility
  async getPaymentHistory(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ payments: Payment[]; total: number }> {
    const response = await api.get('/payments', { 
      params: { page, limit: pageSize } 
    });
    return {
      payments: response.data.payments,
      total: response.data.total,
    };
  },

  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  // ==================== STATISTICS ====================

  async getPaymentStats(period: 'week' | 'month' | 'year' = 'month'): Promise<PaymentStats> {
    const response = await api.get('/payments/stats', { params: { period } });
    return response.data;
  },

  // ==================== MOBILE MONEY ====================

  async initiateMobileMoneyPayment(params: InitiateMobileMoneyParams): Promise<Payment> {
    const response = await api.post('/payments/mobile-money/initiate', params);
    return response.data;
  },

  async verifyMobileMoneyPayment(transactionRef: string): Promise<Payment> {
    const response = await api.get(`/payments/mobile-money/verify/${transactionRef}`);
    return response.data;
  },

  // Legacy methods for backward compatibility
  async verifyMoMoPayment(reference: string): Promise<Payment> {
    return this.verifyMobileMoneyPayment(reference);
  },

  async verifyAirtelPayment(reference: string): Promise<Payment> {
    return this.verifyMobileMoneyPayment(reference);
  },

  // ==================== STRIPE ====================

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    const response = await api.post('/payments/stripe/create-intent', { amount, currency });
    return response.data;
  },

  async createCheckoutSession(items: any[], successUrl: string, cancelUrl: string) {
    const response = await api.post('/payments/stripe/create-session', {
      items,
      successUrl,
      cancelUrl,
    });
    return response.data;
  },

  // ==================== PAYMENT METHODS ====================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payments/methods/list');
    return response.data;
  },

  async createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    const response = await api.post('/payments/methods', params);
    return response.data;
  },

  async updatePaymentMethod(id: string, params: Partial<CreatePaymentMethodParams>): Promise<PaymentMethod> {
    const response = await api.put(`/payments/methods/${id}`, params);
    return response.data;
  },

  async deletePaymentMethod(id: string): Promise<void> {
    await api.delete(`/payments/methods/${id}`);
  },

  async setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
    const response = await api.put(`/payments/methods/${id}/default`);
    return response.data;
  },

  // ==================== REFUNDS ====================

  async initiateRefund(paymentId: string, reason: string, amount?: number): Promise<Payment> {
    const response = await api.post(`/payments/${paymentId}/refund`, { reason, amount });
    return response.data;
  },

  // Legacy method
  async requestRefund(paymentId: string, reason: string): Promise<void> {
    await this.initiateRefund(paymentId, reason);
  },

  // ==================== HELPERS ====================

  getPaymentMethodIcon(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.MTN_MOMO:
        return '📱';
      case PaymentMethodType.AIRTEL_MONEY:
        return '📱';
      case PaymentMethodType.CARD:
        return '💳';
      case PaymentMethodType.BANK_TRANSFER:
        return '🏦';
      case PaymentMethodType.CASH:
        return '💵';
      default:
        return '💰';
    }
  },

  getPaymentMethodLabel(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.MTN_MOMO:
        return 'MTN Mobile Money';
      case PaymentMethodType.AIRTEL_MONEY:
        return 'Airtel Money';
      case PaymentMethodType.CARD:
        return 'Card';
      case PaymentMethodType.BANK_TRANSFER:
        return 'Bank Transfer';
      case PaymentMethodType.CASH:
        return 'Cash';
      default:
        return type;
    }
  },

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'green';
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return 'yellow';
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return 'red';
      case PaymentStatus.REFUNDED:
        return 'blue';
      default:
        return 'gray';
    }
  },

  getTypeLabel(type: PaymentType): string {
    switch (type) {
      case PaymentType.BOOKING:
        return 'Booking';
      case PaymentType.RENT:
        return 'Rent';
      case PaymentType.DEPOSIT:
        return 'Deposit';
      case PaymentType.VIEWING:
        return 'Viewing';
      case PaymentType.SERVICE_FEE:
        return 'Service Fee';
      case PaymentType.COMMISSION:
        return 'Commission';
      case PaymentType.REFUND:
        return 'Refund';
      default:
        return type;
    }
  },
};
