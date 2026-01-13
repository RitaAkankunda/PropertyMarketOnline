import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, ListingType } from '../entities/property.entity';

export class QueryPropertyDto {
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  // Map view parameters
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  north?: number; // North bound (latitude)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  south?: number; // South bound (latitude)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  east?: number; // East bound (longitude)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  west?: number; // West bound (longitude)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  centerLat?: number; // Center latitude for radius search

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  centerLng?: number; // Center longitude for radius search

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  radius?: number; // Radius in kilometers

  @IsOptional()
  excludeId?: string; // Exclude specific property ID (for similar properties)

  @IsOptional()
  city?: string; // Filter by city
}
