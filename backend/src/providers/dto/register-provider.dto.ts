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
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class PricingDto {
  @IsEnum(['hourly', 'fixed', 'custom'])
  type: 'hourly' | 'fixed' | 'custom';

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
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

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  serviceRadius: number;
}

export class RegisterProviderDto {
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
}

