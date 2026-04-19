import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DocumentFileDto {
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

export class CreateMaterialIssueItemDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  materialId: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  fromLocationId?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateManualIssueDto {
  @IsDateString()
  issueDate: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  @IsString()
  documentFile?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentFileDto)
  documentFiles?: DocumentFileDto[];

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialIssueItemDto)
  items: CreateMaterialIssueItemDto[];
}

export class CreateProductionIssueDto {
  @IsDateString()
  issueDate: string;

  @IsString()
  productionOrderNo: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productId: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productionQuantity: number;

  @IsOptional()
  @IsString()
  documentFile?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentFileDto)
  documentFiles?: DocumentFileDto[];

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  fromLocationId?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PreviewProductionIssueDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productId: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productionQuantity: number;
}
