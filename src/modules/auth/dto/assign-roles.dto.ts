import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoleAssignmentItemDto {
  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class AssignRolesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentItemDto)
  assignments?: RoleAssignmentItemDto[];
}
