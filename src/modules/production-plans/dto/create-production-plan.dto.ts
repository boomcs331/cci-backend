import { IsString, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateProductionPlanDto {
  @IsString()
  planName: string;

  @IsDateString()
  planDate: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanItemDto)
  @IsOptional()
  items?: CreatePlanItemDto[];
}
