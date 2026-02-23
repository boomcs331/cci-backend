import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class AddPlanItemDto {
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

export class UpdatePlanItemDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
