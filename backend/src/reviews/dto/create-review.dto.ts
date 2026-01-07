import { IsNumber, IsString, IsOptional, IsUUID, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReviewDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string; // Link review to completed job (recommended)
}

