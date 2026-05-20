import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductProductionStepDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  stepOrder: number;

  @IsInt()
  @Min(1)
  processId: number;
}

export class UpdateProductProductionStepDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  stepOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  processId?: number;
}

export class ListProductProductionStepsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
