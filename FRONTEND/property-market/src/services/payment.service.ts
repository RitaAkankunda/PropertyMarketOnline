import api from "./api";
import type { Payment, PaymentMethod } from "@/types";

export interface InitiatePaymentData {
  amount: number;
  currency?: string;
  method: PaymentMethod;
  phoneNumber?: string;
  description: string;
  propertyId?: string;
  jobId?: string;
}

export interface PaymentCheckoutResponse {
  paymentId: string;
  status: string;
  redirectUrl?: string;
  reference: string;
}

export const paymentService = {
  // Initiate payment
  async initiatePayment(data: InitiatePaymentData): Promise<PaymentCheckoutResponse> {
    const response = await api.post<PaymentCheckoutResponse>(
      "/payments/checkout",
      data
    );
    return response.data;
  },

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },

  // Get payment history
  async getPaymentHistory(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ payments: Payment[]; total: number }> {
    const response = await api.get(
      `/payments/history?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Verify MTN MoMo payment
  async verifyMoMoPayment(reference: string): Promise<Payment> {
    const response = await api.get<Payment>(
      `/payments/momo/verify/${reference}`
    );
    return response.data;
  },

  // Verify Airtel Money payment
  async verifyAirtelPayment(reference: string): Promise<Payment> {
    const response = await api.get<Payment>(
      `/payments/airtel/verify/${reference}`
    );
    return response.data;
  },

  // Request refund
  async requestRefund(paymentId: string, reason: string): Promise<void> {
    await api.post(`/payments/${paymentId}/refund`, { reason });
  },

  // Get provider checkout (for service provider payments)
  async initiateProviderPayment(
    jobId: string,
    data: InitiatePaymentData
  ): Promise<PaymentCheckoutResponse> {
    const response = await api.post<PaymentCheckoutResponse>(
      "/payments/provider/checkout",
      { ...data, jobId }
    );
    return response.data;
  },
};
