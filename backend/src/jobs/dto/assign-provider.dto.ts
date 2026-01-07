import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AssignProviderDto {
  @IsUUID()
  providerId: string;

  @IsOptional()
  @IsString()
  message?: string; // Optional message to provider
}

