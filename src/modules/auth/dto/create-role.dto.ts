import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsString({ each: true })
  permissionIds?: string[];
}