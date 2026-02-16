import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString()
  matCode: string;

  @IsNumber()
  matTypeId: number;

  @IsNumber()
  defaultLocationId: number;

  @IsString()
  matName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsNumber()
  modelId?: number;

  @IsOptional()
  @IsNumber()
  deliveryTypeId?: number;

  @IsOptional()
  @IsNumber()
  unitId?: number;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @IsNumber()
  loadingPointId?: number;

  @IsOptional()
  @IsNumber()
  processLineId?: number;

  @IsOptional()
  @IsNumber()
  initialStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  matCode?: string;

  @IsOptional()
  @IsNumber()
  matTypeId?: number;

  @IsOptional()
  @IsNumber()
  defaultLocationId?: number;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return typeof value === 'string' ? value : String(value);
  })
  @IsOptional()
  @IsString()
  matName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  updateBy?: string;
  @IsOptional()
  @IsNumber()
  initialStock?: number;
}

export class CreateMaterialsTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class CreateItemsNameDto {
  @IsNumber()
  materialId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class StockTransactionDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class CreateMaterialsLocationDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}


export class CreateSupplierDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  createBy?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  updateBy?: string;
}
