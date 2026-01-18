import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Matches } from 'class-validator';
import { PaymentMethodType, PaymentType } from '../entities/payment.entity';

export class InitiateMobileMoneyDto {
  @IsEnum([PaymentMethodType.MTN_MOMO, PaymentMethodType.AIRTEL_MONEY])
  provider: PaymentMethodType.MTN_MOMO | PaymentMethodType.AIRTEL_MONEY;

  @IsString()
  @Matches(/^(256|0)?[37][0-9]{8}$/, {
    message: 'Please provide a valid Ugandan phone number',
  })
  phoneNumber: string;

  @IsNumber()
  @Min(500)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'UGX';

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
