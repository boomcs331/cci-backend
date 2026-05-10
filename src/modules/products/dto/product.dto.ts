import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  productTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  defaultLocationId?: number;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  modelId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  deliveryTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  unitId?: number;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  loadingPointId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n =
      typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })
  @IsNumber()
  processLineId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  productTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  defaultLocationId?: number;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  modelId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  deliveryTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  unitId?: number;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  loadingPointId?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  processLineId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBomDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  materialId: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  quantityPerUnit: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  sequenceOrder?: number;
}

export class CreateProductWithBomDto extends CreateProductDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomDto)
  bom?: CreateBomDto[];
}

/** หนึ่งขั้นในเส้นทางผลิตของสินค้า — processCode เช่น welding, press (จะ normalize เป็น WELDING, PRESS) */
export class ProductProductionStepItemDto {
  @IsString()
  processCode: string;

  @IsOptional()
  @IsString()
  processName?: string;
}

export class SetProductProductionStepsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductProductionStepItemDto)
  steps: ProductProductionStepItemDto[];
}
