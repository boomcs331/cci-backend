import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
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
  @IsNumber()
  productTypeId?: number;

  @IsOptional()
  @IsNumber()
  defaultLocationId?: number;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  customerId?: number;

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
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  productTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  defaultLocationId?: number;

  @IsOptional()
  @IsString()
  lr?: string;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  lotSize?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  modelId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  deliveryTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  unitId?: number;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  loadingPointId?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
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
  @Transform(({ value }) => value ? parseInt(value) : undefined)
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
