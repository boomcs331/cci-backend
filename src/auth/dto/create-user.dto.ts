import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail({}, { message: 'email must be a valid email' })
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}