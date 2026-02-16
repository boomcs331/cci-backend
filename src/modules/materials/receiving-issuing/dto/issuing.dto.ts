import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateIssuingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  workOrderNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
