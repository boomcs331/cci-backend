import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceivingLotDto {
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateReceivingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  totalQuantity: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsString()
  poNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class CreateIssuingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  quantity: number;

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
