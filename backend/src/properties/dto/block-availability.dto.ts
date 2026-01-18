import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BlockAvailabilityDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
