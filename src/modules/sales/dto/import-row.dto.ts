import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class ImportRowDto {
  @IsString()
  @IsOptional()
  orderGroup?: string;

  @IsString()
  @IsNotEmpty()
  customerCode: string;

  @IsString()
  @IsNotEmpty()
  productCode: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  salesChannel?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
