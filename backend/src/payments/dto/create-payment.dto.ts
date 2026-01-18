import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethodType, PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'UGX';

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
