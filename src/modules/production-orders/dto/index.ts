import { IsNumber, IsString, IsOptional, IsPositive, IsInt } from 'class-validator';

export class CreateProductionOrderDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  orderQuantity: number;

  /** จำนวนชิ้นต่อกล่อง/ต่อ QR — ถ้าไม่ส่งใช้ product.lot_size หรือ 100; total QR = ceil(orderQuantity / lotSize) */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  lotSize?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsInt()
  planId?: number;

  @IsOptional()
  @IsInt()
  planItemId?: number;
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
