import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  MinLength,
} from 'class-validator';
import { TicketStatus, TicketPriority } from '../entities/maintenance-ticket.entity';

export class UpdateMaintenanceTicketDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsString()
  @IsOptional()
  property?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  assignedProviderId?: string;

  @IsNumber()
  @IsOptional()
  escrowAmount?: number;
}

