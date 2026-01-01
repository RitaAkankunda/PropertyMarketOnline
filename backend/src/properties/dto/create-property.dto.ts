import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

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
