import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, ListingType } from '../entities/property.entity';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsEnum(ListingType)
  listingType: ListingType;

  // Regular property fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parking?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  area?: number;

  @IsOptional()
  @IsString()
  areaUnit?: string; // sqm, sqft, acres, hectares

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Type(() => Number)
  yearBuilt?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  furnished?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  // Hotel-specific fields
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  totalRooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  starRating?: number;

  @IsOptional()
  @IsString()
  checkInTime?: string; // HH:mm format

  @IsOptional()
  @IsString()
  checkOutTime?: string; // HH:mm format

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
