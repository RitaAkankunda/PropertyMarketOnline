import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaymentMethodType } from '../entities/payment.entity';

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  last4?: string;

  @IsString()
  @IsOptional()
  cardBrand?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  expiryMonth?: number;

  @IsNumber()
  @Min(2024)
  @IsOptional()
  expiryYear?: number;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
