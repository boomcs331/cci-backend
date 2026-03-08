import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

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
  @IsDateString()
  mfgDate?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
