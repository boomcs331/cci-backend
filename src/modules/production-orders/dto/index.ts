import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateProductionOrderDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  orderQuantity: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class StartProcessDto {
  @IsNumber()
  processId: number;

  @IsString()
  operator: string;
}

export class CompleteProcessDto {
  @IsNumber()
  processId: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateProcessDto {
  @IsString()
  processCode: string;

  @IsString()
  processName: string;

  @IsNumber()
  sequenceOrder: number;
}
