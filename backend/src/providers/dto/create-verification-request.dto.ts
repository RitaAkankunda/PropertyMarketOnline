import { IsString, IsOptional, IsArray, ValidateNested, IsUrl, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class AdditionalDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class CreateVerificationRequestDto {
  @IsString()
  @IsOptional()
  @IsUrl()
  idDocumentUrl?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  businessLicenseUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalDocumentDto)
  @IsOptional()
  additionalDocuments?: AdditionalDocumentDto[];
}
