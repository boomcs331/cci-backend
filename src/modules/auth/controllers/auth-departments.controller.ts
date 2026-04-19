import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthDepartmentsController {
  constructor(private readonly authService: AuthService) {}

  @Post('departments')
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department =
      await this.authService.createDepartment(createDepartmentDto);
    return withMessage(
      'Department created successfully',
      'department',
      department,
    );
  }

  @Get('departments')
  async getAllDepartments() {
    const departments = await this.authService.findAllDepartments();
    return withCollection('departments', departments);
  }

  @Get('departments/:id')
  async getDepartmentById(@Param('id') id: string) {
    return this.authService.findDepartmentById(id);
  }

  @Put('departments/:id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.authService.updateDepartment(
      id,
      updateDepartmentDto,
    );
    return withMessage(
      'Department updated successfully',
      'department',
      department,
    );
  }

  @Delete('departments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDepartment(@Param('id') id: string) {
    await this.authService.deleteDepartment(id);
    return { message: 'Department deleted successfully' };
  }
}
