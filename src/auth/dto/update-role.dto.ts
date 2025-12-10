import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}