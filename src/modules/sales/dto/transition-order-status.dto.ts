import { IsIn, IsOptional, IsString } from 'class-validator';
import type { SalesOrderStatus } from '../entities';

const WAREHOUSE_STATUSES = [
  'PROCESSING',
  'SHIPPING',
  'COMPLETED',
] as const satisfies readonly SalesOrderStatus[];

export class TransitionOrderStatusDto {
  @IsIn(WAREHOUSE_STATUSES)
  status: (typeof WAREHOUSE_STATUSES)[number];

  @IsString()
  @IsOptional()
  note?: string;
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
