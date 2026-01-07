import { IsString, IsOptional, IsEnum } from 'class-validator';
import { VerificationRequestStatus } from '../entities/provider-verification-request.entity';

export class ReviewVerificationRequestDto {
  @IsEnum(VerificationRequestStatus)
  status: VerificationRequestStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

