import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionOrderDto {
  @IsString()
  productCode: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductionOrderDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class IssueMaterialDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  lots?: { qrCode: string; quantity: number }[];
}

export class IssueMaterialsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueMaterialDto)
  items: IssueMaterialDto[];

  @IsOptional()
  @IsString()
  requester?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
