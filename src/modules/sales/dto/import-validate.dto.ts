import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImportRowDto } from './import-row.dto';

export class ImportValidateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows: ImportRowDto[];
}
