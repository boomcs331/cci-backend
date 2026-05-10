import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class TraceabilityByLotDto {
  @IsOptional()
  @IsString()
  lotNo?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;
}

export class TraceabilityByProductionOrderDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;
}
