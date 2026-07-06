import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsNumber()
  customerId: number;

  @IsString()
  @IsOptional()
  salesChannel?: string;

  @IsDateString()
  @IsOptional()
  orderDate?: string;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  note?: string;

  /** DRAFT = บันทึกร่าง, PENDING = ส่งคำขอขายสินค้า */
  @IsIn(['DRAFT', 'PENDING'])
  @IsOptional()
  status?: 'DRAFT' | 'PENDING';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
