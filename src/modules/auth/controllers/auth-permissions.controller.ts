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
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthPermissionsController {
  constructor(private readonly authService: AuthService) {}

  @Post('permissions')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.authService.createPermission(createPermissionDto);
    return withMessage(
      'Permission created successfully',
      'permission',
      permission,
    );
  }

  @Get('permissions')
  async getAllPermissions() {
    const permissions = await this.authService.findAllPermissions();
    return withCollection('permissions', permissions);
  }

  @Get('permissions/:id')
  async getPermissionById(@Param('id') id: string) {
    return this.authService.findPermissionById(id);
  }

  @Put('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.authService.updatePermission(
      id,
      updatePermissionDto,
    );
    return withMessage(
      'Permission updated successfully',
      'permission',
      permission,
    );
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param('id') id: string) {
    await this.authService.deletePermission(id);
    return { message: 'Permission deleted successfully' };
  }

  @Get('permissions/:id/roles')
  async getPermissionRoles(@Param('id') id: string) {
    const roles = await this.authService.getPermissionRoles(id);
    return withCollection('roles', roles);
  }

  @Get('permissions/modules/:module')
  async getPermissionsByModule(@Param('module') module: string) {
    const permissions = await this.authService.getPermissionsByModule(module);
    return withCollection('permissions', permissions);
  }

  @Get('permissions/:id/roles-with-permission')
  async getRolesWithPermission(@Param('id') permissionId: string) {
    const roles = await this.authService.getRolesWithPermission(permissionId);
    return withCollection('roles', roles);
  }

  @Get('modules')
  async getAllModules() {
    const modules = await this.authService.getAllModules();
    return withCollection('modules', modules);
  }
}
