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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RequireAdminGlobal } from '../decorators/require-admin-global.decorator';
import { AdminGlobalGuard } from '../guards/admin-global.guard';
import { AuthService } from '../services/auth.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthDepartmentsController {
  constructor(private readonly authService: AuthService) {}

  @Post('departments')
  @UseGuards(AdminGlobalGuard)
  @RequireAdminGlobal()
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
  @UseGuards(AdminGlobalGuard)
  @RequireAdminGlobal()
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
  @UseGuards(AdminGlobalGuard)
  @RequireAdminGlobal()
  async deleteDepartment(@Param('id') id: string) {
    await this.authService.deleteDepartment(id);
    return { message: 'Department deleted successfully' };
  }
}
