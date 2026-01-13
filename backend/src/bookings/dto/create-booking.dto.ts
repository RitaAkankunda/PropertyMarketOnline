import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsEmail,
  Min,
} from 'class-validator';
import { BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsEnum(BookingType)
  type: BookingType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  message?: string;

  // Viewing schedule
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string;

  // Airbnb/hotel bookings
  @IsDateString()
  @IsOptional()
  checkInDate?: string;

  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  guests?: number;

  // Rental/lease
  @IsDateString()
  @IsOptional()
  moveInDate?: string;

  @IsString()
  @IsOptional()
  leaseDuration?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  occupants?: number;

  // Sale
  @IsNumber()
  @IsOptional()
  @Min(0)
  offerAmount?: number;

  @IsString()
  @IsOptional()
  financingType?: string;

  // Commercial
  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  spaceRequirements?: string;

  @IsString()
  @IsOptional()
  leaseTerm?: string;

  // Payment
  @IsNumber()
  @IsOptional()
  @Min(0)
  paymentAmount?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
