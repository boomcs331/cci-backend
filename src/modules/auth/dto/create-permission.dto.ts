import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;
}