import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddPlanItemDto } from './plan-item.dto';

export class UpdateProductionPlanDto {
  @IsString()
  @IsOptional()
  planName?: string;

  @IsDateString()
  @IsOptional()
  planDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddPlanItemDto)
  items?: AddPlanItemDto[];
}
