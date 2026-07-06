import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RequireAdminGlobal } from '../decorators/require-admin-global.decorator';
import { AdminGlobalGuard } from '../guards/admin-global.guard';
import { AuthService } from '../services/auth.service';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseGuards(AdminGlobalGuard)
@RequireAdminGlobal()
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthRolesController {
  constructor(private readonly authService: AuthService) {}

  @Post('roles-with-permissions')
  async createRoleWithPermissions(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.authService.createRole(createRoleDto);
    return withMessage(
      'Role with permissions created successfully',
      'role',
      role,
    );
  }

  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.authService.createRole(createRoleDto);
    return withMessage('Role created successfully', 'role', role);
  }

  @Get('roles')
  async getAllRoles() {
    const roles = await this.authService.findAllRoles();
    return withCollection('roles', roles);
  }

  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    return this.authService.findRoleById(id);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.authService.updateRole(id, updateRoleDto);
    return withMessage('Role updated successfully', 'role', role);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: string) {
    await this.authService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

  @Patch('roles/:id/toggle-status')
  async toggleRoleStatus(@Param('id') id: string) {
    const role = await this.authService.toggleRoleStatus(id);
    return withMessage('Role status updated successfully', 'role', role);
  }

  @Get('roles/:id/users')
  async getRoleUsers(@Param('id') id: string) {
    const users = await this.authService.getRoleUsers(id);
    return withCollection('users', users);
  }

  @Put('roles/:id/permissions')
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    const role = await this.authService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto.permissionIds,
    );
    return withMessage(
      'Permissions assigned to role successfully',
      'role',
      role,
    );
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const role = await this.authService.removePermissionFromRole(
      roleId,
      permissionId,
    );
    return withMessage(
      'Permission removed from role successfully',
      'role',
      role,
    );
  }

  @Post('roles/:roleId/permissions/:permissionId')
  async addPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const role = await this.authService.addPermissionToRole(
      roleId,
      permissionId,
    );
    return withMessage('Permission added to role successfully', 'role', role);
  }

  @Get('roles/:id/users-with-role')
  async getUsersWithRole(@Param('id') roleId: string) {
    const users = await this.authService.getUsersWithRole(roleId);
    return withCollection('users', users);
  }
}
