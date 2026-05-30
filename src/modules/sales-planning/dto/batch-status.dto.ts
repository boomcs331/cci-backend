import { IsInt, IsOptional, IsString } from 'class-validator';

export class BatchStatusDto {
  @IsInt()
  batchId: number;

  @IsString()
  @IsOptional()
  jobId?: string;
}
