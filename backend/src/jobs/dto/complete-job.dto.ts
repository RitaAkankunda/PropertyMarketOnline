import { IsOptional, IsString, IsArray } from 'class-validator';

export class CompleteJobDto {
  @IsOptional()
  @IsString()
  completionNotes?: string; // Notes about completion

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completionPhotos?: string[]; // URLs of completion photos
}

