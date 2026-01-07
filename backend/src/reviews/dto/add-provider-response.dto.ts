import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddProviderResponseDto {
  @IsString()
  @MinLength(10, { message: 'Response must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Response must not exceed 1000 characters' })
  response: string;
}

