import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(150)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  iconKey?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCollapsible?: boolean;

  @IsOptional()
  @IsBoolean()
  adminOnly?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  permissionCodes?: string[];

  @IsOptional()
  @IsIn(['all', 'any'])
  permissionMatch?: 'all' | 'any';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  allowedDepartments?: string[];

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
