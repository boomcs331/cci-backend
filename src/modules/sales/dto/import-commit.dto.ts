import { IsString, IsNotEmpty } from 'class-validator';

export class ImportCommitDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;
}
