import { IsString, IsDateString, IsOptional } from 'class-validator';

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
}
