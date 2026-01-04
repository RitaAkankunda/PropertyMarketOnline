import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  MinLength,
} from 'class-validator';
import { TicketCategory, TicketPriority } from '../entities/maintenance-ticket.entity';

export class CreateMaintenanceTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsNotEmpty()
  property: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  tenantPhone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

