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

  // Land-specific fields
  @IsOptional()
  @IsString()
  landUseType?: string; // agricultural, residential, commercial, industrial, mixed

  @IsOptional()
  @IsString()
  topography?: string; // flat, sloped, hilly, valley

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  roadAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  waterAvailability?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  electricityAvailability?: boolean;

  @IsOptional()
  @IsString()
  titleType?: string; // freehold, leasehold, mailo

  @IsOptional()
  @IsString()
  soilQuality?: string;

  // Commercial-specific fields
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  frontageWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ceilingHeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  loadingBays?: number;

  @IsOptional()
  @IsString()
  footTrafficLevel?: string; // low, medium, high, very_high

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  threePhasePower?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hvacSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  fireSafety?: boolean;

  // Warehouse-specific fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  clearHeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  loadingDocks?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  driveInAccess?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  floorLoadCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  columnSpacing?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  officeArea?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  coldStorage?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rampAccess?: boolean;

  // Office-specific fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  workstationCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  meetingRooms?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  receptionArea?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  elevator?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  conferenceRoom?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  serverRoom?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cafeteria?: boolean;

  // Pricing fields - Hotel specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  standardRoomRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  peakSeasonRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offPeakSeasonRate?: number;

  // Pricing fields - Airbnb specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  nightlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weeklyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cleaningFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  securityDeposit?: number;

  // Pricing fields - Land specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerAcre?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerHectare?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalLandPrice?: number;

  // Pricing fields - Commercial specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerSqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  commercialDeposit?: number;

  // Pricing fields - Warehouse specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  warehouseLeaseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  warehousePricePerSqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  warehouseDeposit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  utilitiesIncluded?: boolean;

  // Pricing fields - Office specific
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerWorkstation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  officePricePerSqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sharedFacilitiesCost?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  officeUtilitiesIncluded?: boolean;

  // General pricing fields
  @IsOptional()
  @IsString()
  currency?: string; // UGX, USD, etc.

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  negotiable?: boolean;

  // Location fields
  @IsOptional()
  @IsString()
  region?: string; // Central, Eastern, Northern, Western

  @IsOptional()
  @IsString()
  city?: string; // One of 11 major cities

  @IsOptional()
  @IsString()
  district?: string; // One of 137 districts

  @IsOptional()
  @IsString()
  county?: string; // County/Municipality

  @IsOptional()
  @IsString()
  subcounty?: string; // Subcounty/Division

  @IsOptional()
  @IsString()
  parish?: string; // Parish/Ward

  @IsOptional()
  @IsString()
  village?: string; // Village/Zone

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
