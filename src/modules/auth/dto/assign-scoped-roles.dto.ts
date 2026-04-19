import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScopedRoleAssignmentDto {
  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class AssignScopedRolesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScopedRoleAssignmentDto)
  assignments: ScopedRoleAssignmentDto[];
}
