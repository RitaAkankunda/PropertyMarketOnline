import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  initialMessage?: string;
}
