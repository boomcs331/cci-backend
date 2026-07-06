import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IssuingDocumentDto {
  @IsString()
  fileName: string;

  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class CreateIssuingWithDocumentDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  issuingTypeId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssuingDocumentDto)
  documents?: IssuingDocumentDto[];

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  workOrderNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
