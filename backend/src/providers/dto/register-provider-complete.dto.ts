import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  MinLength,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class PricingDto {
  @IsEnum(['hourly', 'fixed', 'custom'])
  type: 'hourly' | 'fixed' | 'custom';

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumCharge?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

class AvailabilityDto {
  @IsArray()
  @IsString({ each: true })
  days: string[];

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

class LocationDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsNumber()
  @Min(1)
  serviceRadius: number;
}

export class RegisterProviderCompleteDto {
  // User account fields
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Provider fields
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  businessName: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  serviceTypes: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  description: string;

  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability: AvailabilityDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}

