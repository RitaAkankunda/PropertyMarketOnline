import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsArray()
  @IsOptional()
  attachments?: { url: string; name: string; type: string; size: number }[];
}
