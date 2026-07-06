import {
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { RoleScopeType } from '../entities/role.entity';

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
  @IsEnum(RoleScopeType)
  scopeType?: RoleScopeType;

  @IsOptional()
  @IsString({ each: true })
  permissionIds?: string[];
}
