import { IsNumber, IsString, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateReviewDto {
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment?: string;
}

