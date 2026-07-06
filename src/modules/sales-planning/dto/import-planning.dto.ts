import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class ImportPlanningDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;
}
