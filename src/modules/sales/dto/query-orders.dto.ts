import { IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export const SALES_ORDER_STATUSES = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'PROCESSING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;

const SORTABLE = ['orderNo', 'orderDate', 'deliveryDate', 'grandTotal', 'status', 'createDate'] as const;

export class QueryOrdersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(SALES_ORDER_STATUSES)
  @IsOptional()
  status?: (typeof SALES_ORDER_STATUSES)[number];

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  salesUserId?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @Type(() => Number)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsOptional()
  pageSize?: number;

  @IsIn(SORTABLE)
  @IsOptional()
  sortBy?: (typeof SORTABLE)[number];

  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortDir?: 'ASC' | 'DESC';
}
