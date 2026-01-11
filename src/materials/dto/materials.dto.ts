import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  matCode: string;

  @IsNumber()
  matTypeId: number;

  @IsNumber()
  defaultLocationId: number;

  @IsString()
  name: string;

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

  @IsOptional()
  @IsString()
  name?: string;

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
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  updateBy?: string;
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