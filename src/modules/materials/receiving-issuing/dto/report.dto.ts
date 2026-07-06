import { IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialTransactionReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  materialId?: number;

  @IsOptional()
  @IsString()
  materialCode?: string;
}
